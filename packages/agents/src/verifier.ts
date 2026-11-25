import { z } from 'zod'
import {
  confirmedFactSchema,
  draftBulletSchema,
  type ConfirmedFact,
  type DraftBullet,
} from './contracts.js'

export const reviewSchema = z.strictObject({
  supported: z.boolean(),
  seniorityInflation: z.boolean(),
  reasons: z.array(z.string().trim().min(1)).max(20),
})
export interface DraftReviewExecution {
  review(
    bullet: DraftBullet,
    facts: readonly ConfirmedFact[],
    signal: AbortSignal,
  ): Promise<unknown>
  rewrite(
    bullet: DraftBullet,
    facts: readonly ConfirmedFact[],
    feedback: readonly string[],
    signal: AbortSignal,
  ): Promise<unknown>
}
export interface BulletReport {
  original: DraftBullet
  status: 'kept' | 'rewritten' | 'dropped'
  bullet?: DraftBullet
  reasons: string[]
}
export class VerificationError extends Error {
  constructor() {
    super('Draft verification could not complete')
  }
}

// NFKC, lowercase, Unicode word/number tokens. Preserve decimal/percent/unit tokens;
// no synonyms, stemming, title equivalence, or number conversion is assumed.
export function normalizeClaim(text: string): string[] {
  return (
    text
      .normalize('NFKC')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+(?:[.+#%/-][\p{L}\p{N}]+|[+#%])*/gu) ?? []
  )
}

export async function verifyDraftBullets(
  bullets: readonly DraftBullet[],
  facts: readonly ConfirmedFact[],
  userId: string,
  execution: DraftReviewExecution,
  signal: AbortSignal,
): Promise<{
  bullets: DraftBullet[]
  report: BulletReport[]
  reviewStatus: 'human_review_required'
}> {
  const report: BulletReport[] = []
  async function check(bullet: DraftBullet): Promise<string[]> {
    signal.throwIfAborted()
    const reasons: string[] = []
    if (!bullet.supportingFactIds.length) return ['Missing evidence']
    const cited: ConfirmedFact[] = []
    for (const id of bullet.supportingFactIds) {
      const matches = facts.filter((fact) => fact.id === id)
      if (
        matches.length !== 1 ||
        !confirmedFactSchema.safeParse(matches[0]).success ||
        matches[0]?.userId !== userId
      ) {
        reasons.push('Unknown, unconfirmed, ambiguous, or cross-user fact ID')
      } else cited.push(matches[0]!)
    }
    if (reasons.length) return reasons
    const evidenceTokens = new Set(cited.flatMap((fact) => normalizeClaim(fact.text)))
    if (normalizeClaim(bullet.text).some((token) => !evidenceTokens.has(token))) {
      reasons.push(
        'Unsupported lexical token: numbers, skills/tools, and titles must occur in cited evidence',
      )
    }
    // Lexical overlap is only a rejection filter, never semantic proof.
    const review = reviewSchema.parse(await execution.review(bullet, cited, signal))
    signal.throwIfAborted()
    if (!review.supported || review.seniorityInflation) {
      reasons.push(
        ...(review.reasons.length ? review.reasons : ['Unsupported claim or seniority inflation']),
      )
    }
    return reasons
  }
  try {
    if (bullets.length > 20) throw new VerificationError()
    for (const original of bullets) {
      signal.throwIfAborted()
      const reasons = await check(original)
      if (!reasons.length) {
        report.push({
          original,
          status: 'kept',
          bullet: original,
          reasons: ['Evidence checks and model review passed; human review still required'],
        })
        continue
      }
      // Identity/provenance failures are never repaired into a different identity.
      if (reasons.some((reason) => /fact ID|Missing evidence/.test(reason))) {
        report.push({ original, status: 'dropped', reasons })
        continue
      }
      const cited = facts.filter((fact) => original.supportingFactIds.includes(fact.id))
      const rewritten = draftBulletSchema.safeParse(
        await execution.rewrite(original, cited, reasons, signal),
      )
      if (!rewritten.success) {
        report.push({
          original,
          status: 'dropped',
          reasons: [...reasons, 'Rewrite had invalid structure'],
        })
        continue
      }
      const failures = await check(rewritten.data)
      report.push(
        failures.length
          ? {
              original,
              status: 'dropped',
              reasons: [...reasons, ...failures, 'One rewrite exhausted'],
            }
          : {
              original,
              status: 'rewritten',
              bullet: rewritten.data,
              reasons: [...reasons, 'Rewrite passed reverification; human review still required'],
            },
      )
    }
    return {
      bullets: report.flatMap((item) => (item.bullet ? [item.bullet] : [])),
      report,
      reviewStatus: 'human_review_required',
    }
  } catch {
    throw new VerificationError()
  }
}
