import type { HttpMethod, MatchOperator } from '../constants'

export interface KeyValuePair {
  key: string
  value: string
  enabled: boolean
}

export interface HeaderMod {
  operation: 'set' | 'remove'
  header: string
  value: string
}

export interface InterceptRule {
  id: string
  name: string
  enabled: boolean
  order: number
  match: {
    operator: MatchOperator
    value: string
    methods?: HttpMethod[]
  }
  action: {
    type: 'block' | 'delay' | 'redirect' | 'modify-headers'
    delayMs?: number
    redirectUrl?: string
    preservePath?: boolean
    requestHeaders?: HeaderMod[]
    responseHeaders?: HeaderMod[]
  }
  createdAt: number
  updatedAt: number
}
