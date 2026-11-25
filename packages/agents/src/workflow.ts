import { createHash } from 'node:crypto'
import type { AnyTool } from '@anvia/core'
import { z } from 'zod'
import { createAgentExecution, extractionSchema, type AgentExecution } from './agent.js'
import {
  applicationKitDraftSchema,
  fitAnalysisSchema,
  postingSchema,
  runContextSchema,
  type ApplicationKitDraft,
  type FitAnalysis,
  type RunContext,
  type ConfirmedFact,
} from './contracts.js'
import type { ReadOnlyDependencies } from './repositories.js'
import { createReadOnlyTools } from './tools.js'
import { SAFE_OUTREACH } from './instructions.js'
import { verifyDraftBullets, VerificationError, type BulletReport } from './verifier.js'

const inputSchema = z.strictObject({
  mode: z.enum(['analyze', 'prepare_draft']),
  posting: z.strictObject({
    id: z.string().trim().min(1).max(200),
    originalText: z.string().trim().min(1).max(30_000),
    sourceUrl: z.url({ protocol: /^https?$/ }).optional(),
  }),
})
type FailureCode =
  | 'invalid_input'
  | 'invalid_posting'
  | 'duplicate'
  | 'invalid_output'
  | 'cancelled'
  | 'tool_limit'
  | 'execution_failed'
  | 'verification_failed'
export type WorkflowResult =
  | { ok: true; mode: 'analyze'; output: FitAnalysis }
  | {
      ok: true
      mode: 'prepare_draft'
      output: ApplicationKitDraft
      verification: { reviewStatus: 'human_review_required'; report: BulletReport[] }
    }
  | { ok: false; code: FailureCode }

class WorkflowError extends Error {
  constructor(readonly code: FailureCode) {
    super(code)
  }
}

/** Shared across mandatory reads, agent turns, and the one permitted repair. */
export function createToolBudget(signal: AbortSignal) {
  let used = 0
  let exceeded = false
  let failed = false
  return {
    assertAvailable() {
      signal.throwIfAborted()
      if (exceeded) throw new WorkflowError('tool_limit')
      if (failed) throw new WorkflowError('execution_failed')
    },
    wrap<T extends AnyTool>(tool: T): T {
      return {
        ...tool,
        call(args: unknown, context = {}) {
          signal.throwIfAborted()
          if (used >= 6) {
            exceeded = true
            throw new WorkflowError('tool_limit')
          }
          used++
          try {
            return Promise.resolve(tool.call(args, { ...context, abortSignal: signal })).catch(
              (error: unknown) => {
                failed = true
                throw error
              },
            )
          } catch (error) {
            failed = true
            throw error
          }
        },
      } as T
    },
  }
}

/** Abort-aware waiting; injected adapters must cooperate to stop their own underlying work. */
async function wait<T>(operation: () => Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted()
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    Promise.resolve()
      .then(operation)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort))
  })
}

export function createWorkflow(
  dependencies: ReadOnlyDependencies,
  execution: AgentExecution = createAgentExecution(),
) {
  return async (
    input: unknown,
    trustedContext: RunContext,
    options: { abortSignal?: AbortSignal } = {},
  ): Promise<WorkflowResult> => {
    const signal = AbortSignal.any([
      AbortSignal.timeout(60_000),
      ...(options.abortSignal ? [options.abortSignal] : []),
    ])
    const budget = createToolBudget(signal)
    try {
      const parsed = inputSchema.safeParse(input)
      const context = runContextSchema.safeParse(trustedContext)
      if (!parsed.success || !context.success) return { ok: false, code: 'invalid_input' }
      signal.throwIfAborted()
      const { mode, posting: raw } = parsed.data
      let extracted: z.infer<typeof extractionSchema>
      try {
        extracted = extractionSchema.parse(
          await wait(() => execution.extract(raw.originalText, signal), signal),
        )
        if (extracted.requirements.some(({ text }) => !raw.originalText.includes(text)))
          throw new Error('Non-extractive requirement')
      } catch {
        if (signal.aborted) throw signal.reason
        return { ok: false, code: 'invalid_posting' }
      }
      const unique = new Map(extracted.requirements.map((r) => [r.text, r]))
      const posting = postingSchema.parse({
        ...raw,
        requirements: [...unique.values()].map((r) => ({
          ...r,
          id: `req-${createHash('sha256')
            .update(JSON.stringify([raw.id, r.text]))
            .digest('hex')}`,
        })),
      })
      const trustedFacts = new Map<string, ConfirmedFact>()
      const base = createReadOnlyTools(context.data, dependencies, (facts) => {
        for (const fact of facts) {
          const previous = trustedFacts.get(fact.id)
          if (previous && JSON.stringify(previous) !== JSON.stringify(fact))
            throw new Error('Conflicting fact ID')
          trustedFacts.set(fact.id, fact)
        }
      })
      const duplicateTool = budget.wrap(base.check_duplicate)
      const searchTool = budget.wrap(base.search_facts)
      const duplicate = await wait(
        async () => duplicateTool.call({ postingId: posting.id }),
        signal,
      )
      if (mode === 'prepare_draft' && duplicate.duplicate) return { ok: false, code: 'duplicate' }
      const evidence = new Map<string, { id: string; text: string; sourceReference: string }>()
      const collect = (facts: readonly { id: string; text: string; sourceReference: string }[]) => {
        for (const fact of facts) {
          const previous = evidence.get(fact.id)
          if (previous && JSON.stringify(previous) !== JSON.stringify(fact))
            throw new Error('Conflicting fact ID')
          evidence.set(fact.id, fact)
        }
      }
      const found = await wait(
        async () =>
          searchTool.call({
            query: (
              posting.requirements.map((r) => r.text).join(' ') || posting.originalText
            ).slice(0, 500),
            limit: 20,
          }),
        signal,
      )
      collect(found.facts)
      const observedSearch = {
        ...searchTool,
        async call(args: Parameters<typeof searchTool.call>[0]) {
          const result = await searchTool.call(args)
          collect(result.facts)
          return result
        },
      }
      const tools = [budget.wrap(base.get_profile), observedSearch, duplicateTool]
      for (let attempt = 0; attempt < 2; attempt++) {
        budget.assertAvailable()
        try {
          const data = JSON.stringify({
            mode,
            untrustedData: { posting, duplicate, facts: [...evidence.values()] },
            safeOutreach: SAFE_OUTREACH,
          })
          const output = await wait(
            () => execution.execute({ mode, data, repair: attempt === 1, tools, signal }),
            signal,
          )
          budget.assertAvailable()
          if (mode === 'analyze') {
            const result = fitAnalysisSchema.parse(output)
            const requirements = new Set(posting.requirements.map((r) => r.id))
            if (
              result.matches.some(
                (m) =>
                  !requirements.has(m.requirementId) || m.factIds.some((id) => !evidence.has(id)),
              ) ||
              result.gaps.some((g) => !requirements.has(g.requirementId))
            )
              throw new Error('Unknown evidence')
            const covered = new Set([...result.matches, ...result.gaps].map((r) => r.requirementId))
            if (posting.requirements.some((r) => !covered.has(r.id)))
              throw new Error('Missing requirement coverage')
            return { ok: true, mode, output: result }
          }
          const result = applicationKitDraftSchema.parse(output)
          if (result.outreachDraft !== SAFE_OUTREACH) throw new Error('Unsupported draft')
          if (!result.bullets.length && !result.gaps.length)
            throw new Error('Missing clarification')
          if (!execution.verifier) throw new VerificationError()
          const verified = await wait(
            () =>
              verifyDraftBullets(
                result.bullets,
                [...trustedFacts.values()],
                context.data.userId,
                execution.verifier!,
                signal,
              ),
            signal,
          )
          budget.assertAvailable()
          return {
            ok: true,
            mode,
            output: {
              ...result,
              bullets: verified.bullets,
              gaps: [
                ...result.gaps,
                ...verified.report
                  .filter((r) => r.status === 'dropped')
                  .map((r) => `Bullet dropped: ${r.reasons.join('; ')}`),
              ],
            },
            verification: { reviewStatus: verified.reviewStatus, report: verified.report },
          }
        } catch (error) {
          if (error instanceof VerificationError) return { ok: false, code: 'verification_failed' }
          budget.assertAvailable()
          if (attempt === 1) return { ok: false, code: 'invalid_output' }
        }
      }
      return { ok: false, code: 'invalid_output' }
    } catch (error) {
      return {
        ok: false,
        code: signal.aborted
          ? 'cancelled'
          : error instanceof WorkflowError
            ? error.code
            : 'execution_failed',
      }
    }
  }
}
