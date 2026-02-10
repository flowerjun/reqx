import type { MatchOperator, HttpMethod } from '../constants'

export type HeaderOperation = 'set' | 'remove' | 'append'
export type HeaderTarget = 'request' | 'response'

export interface HeaderModification {
  target: HeaderTarget
  operation: HeaderOperation
  name: string
  value: string
  enabled: boolean
}

export interface HeaderOverrideRule {
  id: string
  name: string
  enabled: boolean
  match: {
    operator: MatchOperator
    value: string
    methods?: HttpMethod[]
  }
  modifications: HeaderModification[]
  createdAt: number
  updatedAt: number
}
