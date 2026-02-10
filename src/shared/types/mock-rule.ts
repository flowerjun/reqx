import type { HttpMethod, MatchOperator, MockBodyType } from '../constants'
import type { KeyValuePair } from './intercept-rule'

export interface MockRule {
  id: string
  name: string
  enabled: boolean
  order: number
  match: {
    operator: MatchOperator
    value: string
    methods?: HttpMethod[]
  }
  response: {
    statusCode: number
    headers: KeyValuePair[]
    body: string
    bodyType: MockBodyType
    delayMs: number
  }
  createdAt: number
  updatedAt: number
}
