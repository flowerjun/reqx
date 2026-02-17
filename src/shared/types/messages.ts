import type { InterceptRule } from './intercept-rule'
import type { MockRule } from './mock-rule'
import type { NetworkEntry } from './network-entry'
import type { AuthType, BodyType, HttpMethod } from '../constants'
import type { KeyValuePair } from './intercept-rule'
import type { AuthConfig } from './api-request'
import type { BrowserCookie, CookieSetParams, CookieRemoveParams } from './cookie'
import type { HeaderOverrideRule } from './header-override'

// Panel -> Service Worker
export type PanelCommand =
  | { type: 'INTERCEPTOR_RULES_SYNC'; rules: InterceptRule[] }
  | { type: 'INTERCEPTOR_TOGGLE'; enabled: boolean }
  | { type: 'MOCK_RULES_SYNC'; rules: MockRule[] }
  | { type: 'MOCK_TOGGLE'; enabled: boolean }
  | { type: 'API_REQUEST_EXECUTE'; requestId: string; request: ApiRequestPayload }
  | { type: 'API_REQUEST_CANCEL'; requestId: string }
  | { type: 'INIT'; tabId: number }
  // Cookie commands
  | { type: 'COOKIES_GET_ALL'; domain?: string }
  | { type: 'COOKIE_SET'; params: CookieSetParams }
  | { type: 'COOKIE_REMOVE'; params: CookieRemoveParams }
  | { type: 'COOKIES_CLEAR_DOMAIN'; domain: string }
  // Header override commands
  | { type: 'HEADER_OVERRIDES_SYNC'; rules: HeaderOverrideRule[] }
  | { type: 'HEADER_OVERRIDES_TOGGLE'; enabled: boolean }
  // Overlay control
  | { type: 'OVERLAY_TOGGLE'; enabled: boolean }

export interface ApiRequestPayload {
  method: HttpMethod
  url: string
  headers: KeyValuePair[]
  queryParams: KeyValuePair[]
  bodyType: BodyType
  bodyContent: string
  authType: AuthType
  authConfig: AuthConfig
  withCredentials?: boolean
}

// Service Worker -> Panel
export type BackgroundEvent =
  | { type: 'NETWORK_REQUEST'; entry: NetworkEntry }
  | { type: 'REQUEST_INTERCEPTED'; ruleId: string; url: string }
  | { type: 'REQUEST_MOCKED'; ruleId: string; url: string }
  | { type: 'REQUEST_HEADER_OVERRIDDEN'; ruleId: string; url: string }
  | { type: 'API_RESPONSE'; requestId: string; response: ApiResponsePayload }
  | { type: 'API_ERROR'; requestId: string; error: string }
  | { type: 'DEBUGGER_ATTACHED' }
  | { type: 'DEBUGGER_DETACHED' }
  // Cookie events
  | { type: 'COOKIES_LIST'; cookies: BrowserCookie[] }
  | { type: 'COOKIE_UPDATED'; success: boolean; error?: string }
  | { type: 'COOKIE_REMOVED'; success: boolean; error?: string }
  | { type: 'COOKIES_CLEARED'; domain: string; success: boolean }

export interface ApiResponsePayload {
  statusCode: number
  statusText: string
  headers: Record<string, string>
  requestHeaders: Record<string, string>
  body: string
  duration: number
  size: number
}
