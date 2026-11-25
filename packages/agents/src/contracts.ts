import { z } from 'zod'

const text = z.string().trim().min(1)
const id = text
const sourceUrl = z.url({ protocol: /^https?$/ })

export const confirmedFactSchema = z.strictObject({
  id,
  userId: id,
  confirmed: z.literal(true),
  text,
  sourceReference: text,
})

export const requirementSchema = z.strictObject({
  id,
  text,
  importance: z.enum(['required', 'preferred']),
})

export const postingSchema = z.strictObject({
  id,
  sourceUrl: sourceUrl.optional(),
  originalText: text,
  requirements: z.array(requirementSchema),
})

export const fitAnalysisSchema = z.strictObject({
  recommendation: z.enum(['apply', 'consider', 'skip']),
  matches: z.array(z.strictObject({ requirementId: id, factIds: z.array(id).min(1) })),
  gaps: z.array(z.strictObject({ requirementId: id, explanation: text })),
  explanation: text,
})

export const draftBulletSchema = z.strictObject({
  text,
  supportingFactIds: z.array(id).min(1),
})

export const applicationKitDraftSchema = z.strictObject({
  bullets: z.array(draftBulletSchema).max(20),
  outreachDraft: text,
  gaps: z.array(text),
})

/** Parse only from trusted server context, never from model output or request bodies.
 * The brand distinguishes parsed context; validation itself does not authenticate users.
 */
export const runContextSchema = z.strictObject({ userId: id, requestId: id }).brand<'RunContext'>()

export type ConfirmedFact = z.infer<typeof confirmedFactSchema>
export type Requirement = z.infer<typeof requirementSchema>
export type Posting = z.infer<typeof postingSchema>
export type FitAnalysis = z.infer<typeof fitAnalysisSchema>
export type DraftBullet = z.infer<typeof draftBulletSchema>
export type ApplicationKitDraft = z.infer<typeof applicationKitDraftSchema>
export type RunContext = z.infer<typeof runContextSchema>
