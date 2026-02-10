import type { HttpMethod } from '../constants'

export interface NetworkEntry {
  id: string
  url: string
  method: HttpMethod
  statusCode: number
  statusText: string
  requestHeaders: Record<string, string>
  responseHeaders: Record<string, string>
  requestBody?: string
  responseBody?: string
  mimeType: string
  startTime: number
  duration: number
  size: number
  interceptedBy?: string // ruleId
  mockedBy?: string // mockRuleId
}
