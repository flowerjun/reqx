import type { AuthType, BodyType, HttpMethod } from '../constants'
import type { KeyValuePair } from './intercept-rule'

export interface AuthConfig {
  bearerToken?: string
  basicUsername?: string
  basicPassword?: string
  apiKeyHeader?: string
  apiKeyValue?: string
}

export interface SavedRequest {
  id: string
  collectionId: string
  name: string
  method: HttpMethod
  url: string
  queryParams: KeyValuePair[]
  headers: KeyValuePair[]
  bodyType: BodyType
  bodyContent: string
  authType: AuthType
  authConfig: AuthConfig
  preRequestScript: string
  postResponseScript: string
  withCredentials?: boolean
  order?: number
  createdAt: number
  updatedAt: number
}

export interface HistoryEntry {
  id: string
  method: HttpMethod
  url: string
  headers: KeyValuePair[]
  queryParams: KeyValuePair[]
  bodyType: BodyType
  bodyContent: string
  authType: AuthType
  authConfig: AuthConfig
  withCredentials?: boolean
  statusCode: number | null
  duration: number | null
  timestamp: number
}

export interface Collection {
  id: string
  name: string
  description: string
  requests: SavedRequest[]
  createdAt: number
  updatedAt: number
}

export interface EnvironmentVariable {
  key: string
  value: string
  enabled: boolean
}

export interface Environment {
  id: string
  name: string
  variables: EnvironmentVariable[]
  createdAt: number
  updatedAt: number
}
