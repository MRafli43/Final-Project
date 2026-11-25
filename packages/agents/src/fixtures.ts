import type {
  ApplicationRecord,
  FactRecord,
  Profile,
  ReadOnlyDependencies,
} from './repositories.js'

/** DEVELOPMENT/TEST ONLY. Keyword substring matching is NOT production RAG.
 * No embeddings, semantic retrieval, persistence, or production adapter is supplied.
 */
export function createInMemoryFixtures(
  data: {
    profiles?: readonly Profile[]
    facts?: readonly FactRecord[]
    applications?: readonly ApplicationRecord[]
  } = {},
): ReadOnlyDependencies {
  // Snapshot inputs so callers cannot mutate ownership after fixture creation.
  const profiles = (data.profiles ?? []).map((row) => ({ ...row }))
  const facts = (data.facts ?? []).map((row) => ({ ...row }))
  const applications = (data.applications ?? []).map((row) => ({ ...row }))
  return {
    profiles: {
      async getProfile({ userId }) {
        const row = profiles.find((profile) => profile.userId === userId)
        return row ? { ...row } : null
      },
    },
    facts: {
      async search({ userId, query, limit }) {
        return facts
          .filter((fact) => fact.userId === userId && fact.confirmed === true)
          .filter((fact) => fact.text.toLowerCase().includes(query.toLowerCase()))
          .slice(0, limit)
          .map((row) => ({ ...row }))
      },
    },
    applications: {
      async findByPosting({ userId, postingId }) {
        return applications
          .filter((row) => row.userId === userId && row.postingId === postingId)
          .map((row) => ({ ...row }))
      },
    },
  }
}
