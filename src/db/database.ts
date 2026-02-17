import Dexie, { type EntityTable } from 'dexie'
import type { InterceptRule } from '@/shared/types/intercept-rule'
import type { MockRule } from '@/shared/types/mock-rule'
import type { SavedRequest, Collection, Environment, HistoryEntry } from '@/shared/types/api-request'
import { DB_NAME, DB_VERSION } from '@/shared/constants'

export class ReqXDB extends Dexie {
  interceptRules!: EntityTable<InterceptRule, 'id'>
  mockRules!: EntityTable<MockRule, 'id'>
  savedRequests!: EntityTable<SavedRequest, 'id'>
  collections!: EntityTable<Collection, 'id'>
  environments!: EntityTable<Environment, 'id'>
  history!: EntityTable<HistoryEntry, 'id'>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      interceptRules: 'id, order, enabled',
      mockRules: 'id, order, enabled',
      savedRequests: 'id, collectionId, createdAt',
      collections: 'id, name, createdAt',
      environments: 'id, name',
    })
    this.version(DB_VERSION).stores({
      interceptRules: 'id, order, enabled',
      mockRules: 'id, order, enabled',
      savedRequests: 'id, collectionId, createdAt',
      collections: 'id, name, createdAt',
      environments: 'id, name',
      history: 'id, timestamp, method',
    })
  }
}

export const db = new ReqXDB()
