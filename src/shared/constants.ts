export const PORT_NAME = 'reqx-panel'
export const DB_NAME = 'reqx-db'
export const DB_VERSION = 2

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const
export type HttpMethod = (typeof HTTP_METHODS)[number]

export const MATCH_OPERATORS = ['contains', 'equals', 'regex', 'wildcard'] as const
export type MatchOperator = (typeof MATCH_OPERATORS)[number]

export const BODY_TYPES = ['none', 'json', 'form-data', 'raw', 'binary'] as const
export type BodyType = (typeof BODY_TYPES)[number]

export const AUTH_TYPES = ['none', 'bearer', 'basic', 'api-key'] as const
export type AuthType = (typeof AUTH_TYPES)[number]

export const MOCK_BODY_TYPES = ['json', 'text', 'html'] as const
export type MockBodyType = (typeof MOCK_BODY_TYPES)[number]

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-green-500',
  POST: 'text-blue-500',
  PUT: 'text-amber-500',
  PATCH: 'text-orange-500',
  DELETE: 'text-red-500',
  HEAD: 'text-purple-500',
  OPTIONS: 'text-gray-500',
}
