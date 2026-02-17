import type { ApiRequestPayload, ApiResponsePayload } from '@/shared/types/messages'

const activeRequests = new Map<string, AbortController>()

// Cookie session rule IDs use a separate high range to avoid conflicts with intercept DNR rules
const COOKIE_RULE_BASE_ID = 900000
let cookieRuleCounter = 0

async function addCookieSessionRule(url: string, cookieHeader: string): Promise<number> {
  const ruleId = COOKIE_RULE_BASE_ID + (++cookieRuleCounter % 1000)

  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: [
      {
        id: ruleId,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          requestHeaders: [
            {
              header: 'Cookie',
              operation: chrome.declarativeNetRequest.HeaderOperation.SET,
              value: cookieHeader,
            },
          ],
        },
        condition: {
          urlFilter: url,
          resourceTypes: [
            chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
            chrome.declarativeNetRequest.ResourceType.OTHER,
          ],
        },
      },
    ],
    removeRuleIds: [ruleId],
  })

  return ruleId
}

async function removeCookieSessionRule(ruleId: number): Promise<void> {
  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: [],
    removeRuleIds: [ruleId],
  })
}

export async function executeApiRequest(
  requestId: string,
  payload: ApiRequestPayload,
): Promise<ApiResponsePayload> {
  const controller = new AbortController()
  activeRequests.set(requestId, controller)

  let cookieRuleId: number | null = null

  try {
    // Build URL with query params
    const url = new URL(payload.url)
    for (const param of payload.queryParams) {
      if (param.enabled && param.key) {
        url.searchParams.append(param.key, param.value)
      }
    }

    // Build headers as plain object
    const headers: Record<string, string> = {}
    for (const h of payload.headers) {
      if (h.enabled && h.key) {
        headers[h.key] = h.value
      }
    }

    // Apply auth
    switch (payload.authType) {
      case 'bearer':
        if (payload.authConfig.bearerToken) {
          headers['Authorization'] = `Bearer ${payload.authConfig.bearerToken}`
        }
        break
      case 'basic':
        if (payload.authConfig.basicUsername) {
          const creds = btoa(
            `${payload.authConfig.basicUsername}:${payload.authConfig.basicPassword ?? ''}`,
          )
          headers['Authorization'] = `Basic ${creds}`
        }
        break
      case 'api-key':
        if (payload.authConfig.apiKeyHeader && payload.authConfig.apiKeyValue) {
          headers[payload.authConfig.apiKeyHeader] = payload.authConfig.apiKeyValue
        }
        break
    }

    // Inject browser cookies via declarativeNetRequest session rules
    // fetch() forbids setting Cookie header directly (forbidden header per Fetch spec),
    // so we use DNR to inject it at the network stack level
    if (payload.withCredentials) {
      const cookies = await chrome.cookies.getAll({ url: url.toString() })
      if (cookies.length > 0) {
        const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
        cookieRuleId = await addCookieSessionRule(url.toString(), cookieHeader)
        // Keep in headers object for display in response viewer
        headers['Cookie'] = cookieHeader
      }
    }

    // Build body
    let body: BodyInit | undefined
    if (payload.bodyType !== 'none' && !['GET', 'HEAD'].includes(payload.method)) {
      if (payload.bodyType === 'json') {
        headers['Content-Type'] = 'application/json'
        body = payload.bodyContent
      } else if (payload.bodyType === 'form-data') {
        const formData = new FormData()
        try {
          const pairs = JSON.parse(payload.bodyContent) as Record<string, string>
          for (const [k, v] of Object.entries(pairs)) {
            formData.append(k, v)
          }
        } catch {
          body = payload.bodyContent
        }
        body = formData
      } else {
        body = payload.bodyContent
      }
    }

    const startTime = performance.now()

    const response = await fetch(url.toString(), {
      method: payload.method,
      headers,
      body,
      signal: controller.signal,
    })

    const duration = Math.round(performance.now() - startTime)
    const responseBody = await response.text()

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    return {
      statusCode: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      requestHeaders: headers,
      body: responseBody,
      duration,
      size: new Blob([responseBody]).size,
    }
  } finally {
    activeRequests.delete(requestId)
    // Clean up cookie session rule
    if (cookieRuleId !== null) {
      removeCookieSessionRule(cookieRuleId).catch(() => {})
    }
  }
}

export function cancelApiRequest(requestId: string): boolean {
  const controller = activeRequests.get(requestId)
  if (controller) {
    controller.abort()
    activeRequests.delete(requestId)
    return true
  }
  return false
}
