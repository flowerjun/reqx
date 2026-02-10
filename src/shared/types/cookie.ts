export interface BrowserCookie {
  name: string
  value: string
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: 'no_restriction' | 'lax' | 'strict' | 'unspecified'
  expirationDate?: number
  session: boolean
  hostOnly: boolean
  storeId: string
}

export interface CookieFilter {
  domain?: string
  name?: string
  url?: string
}

export interface CookieSetParams {
  url: string
  name: string
  value: string
  domain?: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'no_restriction' | 'lax' | 'strict'
  expirationDate?: number
}

export interface CookieRemoveParams {
  url: string
  name: string
}
