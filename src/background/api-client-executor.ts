import type { ApiRequestPayload, ApiResponsePayload } from '@/shared/types/messages'

const activeRequests = new Map<string, AbortController>()

export async function executeApiRequest(
  requestId: string,
  payload: ApiRequestPayload,
): Promise<ApiResponsePayload> {
  const controller = new AbortController()
  activeRequests.set(requestId, controller)

  try {
    // Build URL with query params
    const url = new URL(payload.url)
    for (const param of payload.queryParams) {
      if (param.enabled && param.key) {
        url.searchParams.append(param.key, param.value)
      }
    }

    // Build headers
    const headers = new Headers()
    for (const h of payload.headers) {
      if (h.enabled && h.key) {
        headers.set(h.key, h.value)
      }
    }

    // Apply auth
    switch (payload.authType) {
      case 'bearer':
        if (payload.authConfig.bearerToken) {
          headers.set('Authorization', `Bearer ${payload.authConfig.bearerToken}`)
        }
        break
      case 'basic':
        if (payload.authConfig.basicUsername) {
          const creds = btoa(
            `${payload.authConfig.basicUsername}:${payload.authConfig.basicPassword ?? ''}`,
          )
          headers.set('Authorization', `Basic ${creds}`)
        }
        break
      case 'api-key':
        if (payload.authConfig.apiKeyHeader && payload.authConfig.apiKeyValue) {
          headers.set(payload.authConfig.apiKeyHeader, payload.authConfig.apiKeyValue)
        }
        break
    }

    // Build body
    let body: BodyInit | undefined
    if (payload.bodyType !== 'none' && !['GET', 'HEAD'].includes(payload.method)) {
      if (payload.bodyType === 'json') {
        headers.set('Content-Type', 'application/json')
        body = payload.bodyContent
      } else if (payload.bodyType === 'form-data') {
        // Parse key=value pairs
        const formData = new FormData()
        try {
          const pairs = JSON.parse(payload.bodyContent) as Record<string, string>
          for (const [k, v] of Object.entries(pairs)) {
            formData.append(k, v)
          }
        } catch {
          // Fallback: send as raw
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

    const requestHeaders: Record<string, string> = {}
    headers.forEach((value, key) => {
      requestHeaders[key] = value
    })

    return {
      statusCode: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      requestHeaders,
      body: responseBody,
      duration,
      size: new Blob([responseBody]).size,
    }
  } finally {
    activeRequests.delete(requestId)
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
