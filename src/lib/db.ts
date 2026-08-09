import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, PullRequestRecord, RepoRecord, ReviewRecord, SyncState } from './types'

export class IlovePrDatabase extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
  repos!: EntityTable<RepoRecord, 'fullName'>
  pullRequests!: EntityTable<PullRequestRecord, 'id'>
  reviews!: EntityTable<ReviewRecord, 'id'>
  syncState!: EntityTable<SyncState, 'repoFullName'>

  constructor() {
    super('ilovepr')
    this.version(1).stores({
      settings: 'id',
      repos: 'fullName, owner',
      pullRequests:
        'id, repoFullName, number, author, state, createdAt, updatedAt, mergedAt, [repoFullName+updatedAt]',
      reviews: 'id, prId, repoFullName, prNumber, author, submittedAt, [repoFullName+author]',
      syncState: 'repoFullName, lastSyncedAt, mode',
    })
  }
}

export const db = new IlovePrDatabase()

export const DEFAULT_BACKFILL_LIMIT = 200
