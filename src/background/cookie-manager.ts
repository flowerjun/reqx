import type { CookieSetParams, CookieRemoveParams, BrowserCookie } from '@/shared/types/cookie'

function chromeCookieToBrowserCookie(cookie: chrome.cookies.Cookie): BrowserCookie {
  return {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite as BrowserCookie['sameSite'],
    expirationDate: cookie.expirationDate,
    session: cookie.session,
    hostOnly: cookie.hostOnly,
    storeId: cookie.storeId,
  }
}

export async function getAllCookies(domain?: string): Promise<BrowserCookie[]> {
  const details: chrome.cookies.GetAllDetails = {}
  if (domain) {
    details.domain = domain
  }
  const cookies = await chrome.cookies.getAll(details)
  return cookies.map(chromeCookieToBrowserCookie)
}

export async function setCookie(params: CookieSetParams): Promise<{ success: boolean; error?: string }> {
  try {
    const details: chrome.cookies.SetDetails = {
      url: params.url,
      name: params.name,
      value: params.value,
    }
    if (params.domain) details.domain = params.domain
    if (params.path) details.path = params.path
    if (params.secure !== undefined) details.secure = params.secure
    if (params.httpOnly !== undefined) details.httpOnly = params.httpOnly
    if (params.sameSite) details.sameSite = params.sameSite
    if (params.expirationDate) details.expirationDate = params.expirationDate

    const cookie = await chrome.cookies.set(details)
    return cookie ? { success: true } : { success: false, error: 'Failed to set cookie' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function removeCookie(params: CookieRemoveParams): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await chrome.cookies.remove({ url: params.url, name: params.name })
    return result ? { success: true } : { success: false, error: 'Failed to remove cookie' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function clearDomainCookies(domain: string): Promise<{ success: boolean }> {
  const cookies = await chrome.cookies.getAll({ domain })
  const protocol = 'https://'
  for (const cookie of cookies) {
    const url = protocol + cookie.domain.replace(/^\./, '') + cookie.path
    await chrome.cookies.remove({ url, name: cookie.name })
  }
  return { success: true }
}
