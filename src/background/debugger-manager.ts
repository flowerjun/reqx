import type { InterceptRule } from '@/shared/types/intercept-rule'
import type { MockRule } from '@/shared/types/mock-rule'
import type { HeaderOverrideRule } from '@/shared/types/header-override'
import type { NetworkEntry } from '@/shared/types/network-entry'
import type { HttpMethod } from '@/shared/constants'
import { matchUrl, buildRedirectUrl } from '@/shared/url-matcher'
import { sendToPanel } from './message-router'
import { getOverlayEnabled } from './overlay-state'

interface TabSession {
  tabId: number
  attached: boolean
  interceptRules: InterceptRule[]
  mockRules: MockRule[]
  headerOverrideRules: HeaderOverrideRule[]
  interceptEnabled: boolean
  mockEnabled: boolean
  headerOverrideEnabled: boolean
}

const sessions = new Map<number, TabSession>()

export function getOrCreateSession(tabId: number): TabSession {
  let session = sessions.get(tabId)
  if (!session) {
    session = {
      tabId,
      attached: false,
      interceptRules: [],
      mockRules: [],
      headerOverrideRules: [],
      interceptEnabled: false,
      mockEnabled: false,
      headerOverrideEnabled: false,
    }
    sessions.set(tabId, session)
  }
  return session
}

export async function attachDebugger(tabId: number): Promise<void> {
  const session = getOrCreateSession(tabId)
  if (session.attached) return

  try {
    await chrome.debugger.attach({ tabId }, '1.3')
    await chrome.debugger.sendCommand({ tabId }, 'Fetch.enable', {
      patterns: [{ urlPattern: '*', requestStage: 'Request' }],
    })
    session.attached = true
    console.log(`[ReqX] Debugger attached for tab ${tabId}`)
    sendToPanel(tabId, { type: 'DEBUGGER_ATTACHED' })
  } catch (err) {
    console.error('[ReqX] Failed to attach debugger:', err)
  }
}

/**
 * Force re-attach debugger after page navigation.
 * Chrome auto-detaches the debugger on navigation, so we must re-attach.
 */
export async function reattachDebugger(tabId: number): Promise<void> {
  const session = getOrCreateSession(tabId)
  session.attached = false
  await attachDebugger(tabId)
}

export async function detachDebugger(tabId: number): Promise<void> {
  const session = sessions.get(tabId)
  if (!session?.attached) return

  try {
    await chrome.debugger.detach({ tabId })
  } catch {
    // May already be detached
  }
  session.attached = false
  sendToPanel(tabId, { type: 'DEBUGGER_DETACHED' })
}

export function updateInterceptRules(tabId: number, rules: InterceptRule[]) {
  const session = getOrCreateSession(tabId)
  session.interceptRules = rules
}

export function updateMockRules(tabId: number, rules: MockRule[]) {
  const session = getOrCreateSession(tabId)
  session.mockRules = rules
}

export function setInterceptEnabled(tabId: number, enabled: boolean) {
  const session = getOrCreateSession(tabId)
  session.interceptEnabled = enabled
  if (enabled) {
    attachDebugger(tabId)
  }
}

export function setMockEnabled(tabId: number, enabled: boolean) {
  const session = getOrCreateSession(tabId)
  session.mockEnabled = enabled
  if (enabled) {
    attachDebugger(tabId)
  }
}

export function updateHeaderOverrideRules(tabId: number, rules: HeaderOverrideRule[]) {
  const session = getOrCreateSession(tabId)
  session.headerOverrideRules = rules
}

export function setHeaderOverrideEnabled(tabId: number, enabled: boolean) {
  const session = getOrCreateSession(tabId)
  session.headerOverrideEnabled = enabled
  if (enabled) {
    attachDebugger(tabId)
  }
}

// CDP event handler
export function initDebuggerEventHandler() {
  chrome.debugger.onEvent.addListener(
    (source, method, params?: object) => {
      const tabId = source.tabId
      if (!tabId || !params) return

      if (method === 'Fetch.requestPaused') {
        handleRequestPaused(tabId, params as Record<string, unknown>)
      }
    },
  )

  chrome.debugger.onDetach.addListener((source) => {
    if (source.tabId) {
      const session = sessions.get(source.tabId)
      if (session) {
        session.attached = false
        sendToPanel(source.tabId, { type: 'DEBUGGER_DETACHED' })
      }
    }
  })
}

async function handleRequestPaused(
  tabId: number,
  params: Record<string, unknown>,
) {
  const session = sessions.get(tabId)
  if (!session) {
    console.warn(`[ReqX] No session for tab ${tabId}, skipping requestPaused`)
    return
  }

  const requestId = params.requestId as string
  const request = params.request as { url: string; method: string; headers: Record<string, string> }
  const url = request.url
  const method = request.method as HttpMethod

  console.log(`[ReqX] requestPaused: ${method} ${url.substring(0, 100)} | mock=${session.mockEnabled} rules=${session.mockRules.length} intercept=${session.interceptEnabled} headers=${session.headerOverrideEnabled}`)

  // --- Phase 1: Pre-evaluate header overrides and send notifications ---
  // Evaluate header overrides FIRST so overlay toasts always appear,
  // even when mock/intercept rules also match the same URL.
  let headerOverrideResult: {
    modifiedHeaders: Record<string, string>
    matchedRuleIds: string[]
  } | null = null

  if (session.headerOverrideEnabled && session.headerOverrideRules.length > 0) {
    const modifiedHeaders = { ...request.headers }
    const matchedRuleIds: string[] = []

    for (const rule of session.headerOverrideRules) {
      if (!rule.enabled) continue
      if (rule.match.methods?.length && !rule.match.methods.includes(method)) continue
      if (!matchUrl(url, rule.match.value, rule.match.operator)) continue

      matchedRuleIds.push(rule.id)
      for (const mod of rule.modifications) {
        if (!mod.enabled || mod.target !== 'request') continue
        switch (mod.operation) {
          case 'set':
            modifiedHeaders[mod.name] = mod.value
            break
          case 'remove':
            delete modifiedHeaders[mod.name]
            break
          case 'append':
            modifiedHeaders[mod.name] = modifiedHeaders[mod.name]
              ? `${modifiedHeaders[mod.name]}, ${mod.value}`
              : mod.value
            break
        }
      }
    }

    if (matchedRuleIds.length > 0) {
      headerOverrideResult = { modifiedHeaders, matchedRuleIds }

      // Send notifications immediately (before mock/intercept processing)
      for (const ruleId of matchedRuleIds) {
        sendToPanel(tabId, { type: 'REQUEST_HEADER_OVERRIDDEN', ruleId, url })
      }
      if (getOverlayEnabled(tabId)) {
        for (const rule of session.headerOverrideRules) {
          if (matchedRuleIds.includes(rule.id)) {
            chrome.tabs.sendMessage(tabId, {
              source: 'reqx', type: 'RULE_MATCHED',
              matchType: 'header-overridden', ruleName: rule.name, url, action: 'header-override',
            }).catch(() => {})
          }
        }
      }
    }
  }

  // --- Phase 2: Check mock rules ---
  // Mock responses are fulfilled locally so header overrides don't apply
  if (session.mockEnabled) {
    if (method === 'OPTIONS') {
      for (const rule of session.mockRules) {
        if (!rule.enabled) continue
        if (matchUrl(url, rule.match.value, rule.match.operator)) {
          const origin = request.headers['Origin'] || request.headers['origin'] || '*'
          try {
            await chrome.debugger.sendCommand({ tabId }, 'Fetch.fulfillRequest', {
              requestId,
              responseCode: 204,
              responseHeaders: [
                { name: 'Access-Control-Allow-Origin', value: origin },
                { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' },
                { name: 'Access-Control-Allow-Headers', value: request.headers['Access-Control-Request-Headers'] || request.headers['access-control-request-headers'] || '*' },
                { name: 'Access-Control-Allow-Credentials', value: 'true' },
                { name: 'Access-Control-Max-Age', value: '86400' },
              ],
            })
          } catch {
            // Request may have been cancelled
          }
          return
        }
      }
    }

    for (const rule of session.mockRules) {
      if (!rule.enabled) continue
      if (rule.match.methods?.length && !rule.match.methods.includes(method)) continue
      if (matchUrl(url, rule.match.value, rule.match.operator)) {
        const origin = request.headers['Origin'] || request.headers['origin'] || '*'
        const userHeaders = rule.response.headers
          .filter((h) => h.enabled)
          .map((h) => ({ name: h.key, value: h.value }))

        const headerNames = new Set(userHeaders.map((h) => h.name.toLowerCase()))
        const corsHeaders: { name: string; value: string }[] = []
        if (!headerNames.has('access-control-allow-origin')) {
          corsHeaders.push({ name: 'Access-Control-Allow-Origin', value: origin })
        }
        if (!headerNames.has('access-control-allow-methods')) {
          corsHeaders.push({ name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD' })
        }
        if (!headerNames.has('access-control-allow-headers')) {
          corsHeaders.push({ name: 'Access-Control-Allow-Headers', value: '*' })
        }
        if (!headerNames.has('access-control-allow-credentials')) {
          corsHeaders.push({ name: 'Access-Control-Allow-Credentials', value: 'true' })
        }
        if (!headerNames.has('access-control-expose-headers')) {
          corsHeaders.push({ name: 'Access-Control-Expose-Headers', value: '*' })
        }

        const headers = [...corsHeaders, ...userHeaders]

        if (rule.response.delayMs > 0) {
          await delay(rule.response.delayMs)
        }

        try {
          console.log(`[ReqX] Fulfilling mock: rule="${rule.name}" status=${rule.response.statusCode} bodyLen=${rule.response.body.length}`)
          await chrome.debugger.sendCommand({ tabId }, 'Fetch.fulfillRequest', {
            requestId,
            responseCode: rule.response.statusCode,
            responseHeaders: headers,
            body: btoa(unescape(encodeURIComponent(rule.response.body))),
          })
          console.log(`[ReqX] Mock fulfilled successfully: ${url.substring(0, 80)}`)
        } catch (err) {
          console.error(`[ReqX] Mock fulfillRequest failed:`, err)
        }

        sendToPanel(tabId, { type: 'REQUEST_MOCKED', ruleId: rule.id, url })
        if (getOverlayEnabled(tabId)) {
          chrome.tabs.sendMessage(tabId, {
            source: 'reqx', type: 'RULE_MATCHED',
            matchType: 'mocked', ruleName: rule.name, url, action: 'mock',
          }).catch(() => {})
        }

        const entry: NetworkEntry = {
          id: crypto.randomUUID(),
          url,
          method,
          statusCode: rule.response.statusCode,
          statusText: 'Mocked',
          requestHeaders: request.headers,
          responseHeaders: Object.fromEntries(headers.map((h) => [h.name, h.value])),
          responseBody: rule.response.body,
          mimeType: 'application/json',
          startTime: Date.now(),
          duration: rule.response.delayMs,
          size: new Blob([rule.response.body]).size,
          mockedBy: rule.id,
        }
        sendToPanel(tabId, { type: 'NETWORK_REQUEST', entry })
        return
      }
    }
  }

  // --- Phase 3: Check intercept rules ---
  if (session.interceptEnabled) {
    for (const rule of session.interceptRules) {
      if (!rule.enabled) continue
      if (rule.match.methods?.length && !rule.match.methods.includes(method)) continue
      if (matchUrl(url, rule.match.value, rule.match.operator)) {
        if (rule.action.type === 'block') {
          try {
            await chrome.debugger.sendCommand({ tabId }, 'Fetch.failRequest', {
              requestId,
              errorReason: 'BlockedByClient',
            })
          } catch {
            // Ignore
          }
          sendToPanel(tabId, { type: 'REQUEST_INTERCEPTED', ruleId: rule.id, url })
          if (getOverlayEnabled(tabId)) {
            chrome.tabs.sendMessage(tabId, {
              source: 'reqx', type: 'RULE_MATCHED',
              matchType: 'intercepted', ruleName: rule.name, url, action: rule.action.type,
            }).catch(() => {})
          }
          sendToPanel(tabId, { type: 'NETWORK_REQUEST', entry: {
            id: crypto.randomUUID(), url, method,
            statusCode: 0, statusText: 'Blocked',
            requestHeaders: request.headers, responseHeaders: {},
            mimeType: '', startTime: Date.now(), duration: 0, size: 0,
            interceptedBy: rule.id,
          }})
          return
        }

        if (rule.action.delayMs && rule.action.delayMs > 0) {
          await delay(rule.action.delayMs)
        }

        const continueParams: Record<string, unknown> = { requestId }

        if (rule.action.redirectUrl) {
          continueParams.url = rule.action.preservePath
            ? buildRedirectUrl(url, rule.match.value, rule.action.redirectUrl, rule.match.operator)
            : rule.action.redirectUrl
        }

        // Start with header-override modified headers if available, then apply intercept header mods
        const headerMods = rule.action.requestHeaders ?? []
        if (headerMods.length > 0 || headerOverrideResult) {
          const baseHeaders = headerOverrideResult?.modifiedHeaders ?? { ...request.headers }
          const modifiedHeaders = { ...baseHeaders }
          for (const h of headerMods) {
            if (h.operation === 'set') modifiedHeaders[h.header] = h.value
            else delete modifiedHeaders[h.header]
          }
          continueParams.headers = Object.entries(modifiedHeaders).map(
            ([name, value]) => ({ name, value }),
          )
        }

        if (continueParams.url || continueParams.headers) {
          try {
            await chrome.debugger.sendCommand({ tabId }, 'Fetch.continueRequest', continueParams)
          } catch {
            // Ignore
          }
          sendToPanel(tabId, { type: 'REQUEST_INTERCEPTED', ruleId: rule.id, url })
          if (getOverlayEnabled(tabId)) {
            chrome.tabs.sendMessage(tabId, {
              source: 'reqx', type: 'RULE_MATCHED',
              matchType: 'intercepted', ruleName: rule.name, url, action: rule.action.type,
            }).catch(() => {})
          }
          sendToPanel(tabId, { type: 'NETWORK_REQUEST', entry: {
            id: crypto.randomUUID(), url, method,
            statusCode: 0, statusText: rule.action.type,
            requestHeaders: request.headers, responseHeaders: {},
            mimeType: '', startTime: Date.now(),
            duration: rule.action.delayMs ?? 0, size: 0,
            interceptedBy: rule.id,
          }})
          return
        }

        // Delay-only: continue request after delay
        sendToPanel(tabId, { type: 'REQUEST_INTERCEPTED', ruleId: rule.id, url })
        if (getOverlayEnabled(tabId)) {
          chrome.tabs.sendMessage(tabId, {
            source: 'reqx', type: 'RULE_MATCHED',
            matchType: 'intercepted', ruleName: rule.name, url, action: rule.action.type,
          }).catch(() => {})
        }
        try {
          await chrome.debugger.sendCommand({ tabId }, 'Fetch.continueRequest', { requestId })
        } catch {
          // Request may have been cancelled
        }
        sendToPanel(tabId, { type: 'NETWORK_REQUEST', entry: {
          id: crypto.randomUUID(), url, method,
          statusCode: 0, statusText: 'Delayed',
          requestHeaders: request.headers, responseHeaders: {},
          mimeType: '', startTime: Date.now(),
          duration: rule.action.delayMs ?? 0, size: 0,
          interceptedBy: rule.id,
        }})
        return
      }
    }
  }

  // --- Phase 4: Apply header overrides only (no mock/intercept matched) ---
  if (headerOverrideResult) {
    try {
      await chrome.debugger.sendCommand({ tabId }, 'Fetch.continueRequest', {
        requestId,
        headers: Object.entries(headerOverrideResult.modifiedHeaders).map(([name, value]) => ({ name, value })),
      })
    } catch {
      // Request may have been cancelled
    }

    const entry: NetworkEntry = {
      id: crypto.randomUUID(),
      url,
      method,
      statusCode: 0,
      statusText: '',
      requestHeaders: headerOverrideResult.modifiedHeaders,
      responseHeaders: {},
      mimeType: '',
      startTime: Date.now(),
      duration: 0,
      size: 0,
    }
    sendToPanel(tabId, { type: 'NETWORK_REQUEST', entry })
    return
  }

  // --- Phase 5: Continue normally (no rule matched) ---
  try {
    await chrome.debugger.sendCommand({ tabId }, 'Fetch.continueRequest', { requestId })
  } catch {
    // Request may have been cancelled
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function cleanupSession(tabId: number) {
  detachDebugger(tabId)
  sessions.delete(tabId)
}
