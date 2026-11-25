export interface Profile {
  userId: string
  summary: string
}

export interface FactRecord {
  id: string
  userId: string
  confirmed: boolean
  text: string
  sourceReference: string
}

export interface ApplicationRecord {
  id: string
  userId: string
  postingId: string
}

/** Implementations must scope the underlying query by userId, not filter after a global query. */
export interface ProfileRepository {
  getProfile(scope: { userId: string }): Promise<Profile | null>
}

export interface FactRetriever {
  search(scope: {
    userId: string
    confirmed: true
    query: string
    limit: number
  }): Promise<readonly FactRecord[]>
}

export interface ApplicationRepository {
  findByPosting(scope: { userId: string; postingId: string }): Promise<readonly ApplicationRecord[]>
}

export interface ReadOnlyDependencies {
  profiles: ProfileRepository
  facts: FactRetriever
  applications: ApplicationRepository
}
