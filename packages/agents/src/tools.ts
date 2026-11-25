import { createTool } from '@anvia/core/tool'
import { z } from 'zod'
import {
  confirmedFactSchema,
  runContextSchema,
  type RunContext,
  type ConfirmedFact,
} from './contracts.js'
import type { ReadOnlyDependencies } from './repositories.js'

const id = z.string().trim().min(1).max(200)
const profileSchema = z.strictObject({ userId: id, summary: z.string() })
const applicationSchema = z.strictObject({ id, userId: id, postingId: id })
const factOutputSchema = confirmedFactSchema.omit({ userId: true, confirmed: true })

export const searchFactsInputSchema = z.strictObject({
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(20).default(5),
})
export const checkDuplicateInputSchema = z.strictObject({ postingId: id })
const profileInputSchema = z.strictObject({})

/** Context must come from authenticated server code, not model arguments. */
export function createReadOnlyTools(
  context: RunContext,
  dependencies: ReadOnlyDependencies,
  onFacts?: (facts: readonly ConfirmedFact[]) => void,
) {
  const { userId } = runContextSchema.parse(context)

  function assertOwned(records: readonly { userId: string }[]) {
    if (records.some((record) => record.userId !== userId)) {
      throw new Error('Repository scope violation')
    }
  }

  return {
    get_profile: createTool({
      name: 'get_profile',
      description: 'Read the current user profile summary. No arguments.',
      inputSchema: profileInputSchema,
      outputSchema: z.strictObject({ profile: z.strictObject({ summary: z.string() }).nullable() }),
      handler: async (args) => {
        profileInputSchema.parse(args)
        const result = await dependencies.profiles.getProfile({ userId })
        if (result === null) return { profile: null }
        const profile = profileSchema.parse(result)
        assertOwned([profile])
        return { profile: { summary: profile.summary } }
      },
    }),
    search_facts: createTool({
      name: 'search_facts',
      description:
        'Search confirmed facts for the current user. Query max 500 characters; limit 1–20.',
      inputSchema: searchFactsInputSchema,
      outputSchema: z.strictObject({ facts: z.array(factOutputSchema).max(20) }),
      handler: async (args) => {
        const { query, limit } = searchFactsInputSchema.parse(args)
        const results = await dependencies.facts.search({ userId, confirmed: true, query, limit })
        // Check every result before truncation or confirmation filtering; never leak partial output.
        assertOwned(results)
        const confirmed = results
          .filter((fact) => fact.confirmed === true)
          .map((fact) => confirmedFactSchema.parse(fact))
          .slice(0, limit)
        onFacts?.(confirmed)
        const facts = confirmed.map(({ id, sourceReference, text }) => ({
          id,
          sourceReference,
          text,
        }))
        return { facts }
      },
    }),
    check_duplicate: createTool({
      name: 'check_duplicate',
      description:
        'Check whether the current user already has an application for an exact posting ID.',
      inputSchema: checkDuplicateInputSchema,
      outputSchema: z.strictObject({ duplicate: z.boolean(), applicationIds: z.array(id) }),
      handler: async (args) => {
        const { postingId } = checkDuplicateInputSchema.parse(args)
        const results = z
          .array(applicationSchema)
          .parse(await dependencies.applications.findByPosting({ userId, postingId }))
        assertOwned(results)
        if (results.some((application) => application.postingId !== postingId)) {
          throw new Error('Repository scope violation')
        }
        return { duplicate: results.length > 0, applicationIds: results.map(({ id }) => id) }
      },
    }),
  }
}
