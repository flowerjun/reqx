import { initMessageRouter, setCommandHandler, setDisconnectHandler, sendToPanel } from './message-router'
import {
  initDebuggerEventHandler,
  updateInterceptRules,
  updateMockRules,
  setInterceptEnabled,
  setMockEnabled,
  updateHeaderOverrideRules,
  setHeaderOverrideEnabled,
  cleanupSession,
  reattachDebugger,
} from './debugger-manager'
import { executeApiRequest, cancelApiRequest } from './api-client-executor'
import { getAllCookies, setCookie, removeCookie, clearDomainCookies } from './cookie-manager'
import { setOverlayEnabled, getOverlayEnabled, cleanupOverlayState } from './overlay-state'
import type { PanelCommand } from '@/shared/types/messages'

console.log('[ReqX] Service Worker loaded')

// Badge management per tab
const tabFeatureState = new Map<number, { intercept: boolean; mock: boolean; headers: boolean }>()

function updateBadge(tabId: number) {
  const state = tabFeatureState.get(tabId)
  if (!state) return

  const activeCount = [state.intercept, state.mock, state.headers].filter(Boolean).length

  if (activeCount > 0) {
    chrome.action.setBadgeText({ text: String(activeCount), tabId })
    chrome.action.setBadgeBackgroundColor({ color: '#F97316', tabId })
    chrome.action.setTitle({ title: `ReqX - ${activeCount} active`, tabId })
  } else {
    chrome.action.setBadgeText({ text: '', tabId })
    chrome.action.setTitle({ title: 'ReqX', tabId })
  }
}

function getFeatureState(tabId: number) {
  let state = tabFeatureState.get(tabId)
  if (!state) {
    state = { intercept: false, mock: false, headers: false }
    tabFeatureState.set(tabId, state)
  }
  return state
}

function notifyContentScript(tabId: number) {
  const state = tabFeatureState.get(tabId)
  if (!state) return
  chrome.tabs.sendMessage(tabId, {
    source: 'reqx',
    type: 'STATUS_UPDATE',
    features: { intercept: state.intercept, mock: state.mock, headers: state.headers },
    overlay: getOverlayEnabled(tabId),
  }).catch(() => {})
}

// Initialize message routing
initMessageRouter()

// Initialize CDP event handler
initDebuggerEventHandler()

// Handle commands from panel
setCommandHandler(async (tabId: number, command: PanelCommand) => {
  switch (command.type) {
    case 'INIT':
      console.log(`[ReqX] Panel initialized for tab ${tabId}`)
      break

    case 'INTERCEPTOR_RULES_SYNC':
      updateInterceptRules(tabId, command.rules)
      break

    case 'INTERCEPTOR_TOGGLE':
      setInterceptEnabled(tabId, command.enabled)
      getFeatureState(tabId).intercept = command.enabled
      updateBadge(tabId)
      notifyContentScript(tabId)
      break

    case 'MOCK_RULES_SYNC':
      updateMockRules(tabId, command.rules)
      break

    case 'MOCK_TOGGLE':
      setMockEnabled(tabId, command.enabled)
      getFeatureState(tabId).mock = command.enabled
      updateBadge(tabId)
      notifyContentScript(tabId)
      break

    case 'API_REQUEST_EXECUTE':
      try {
        const response = await executeApiRequest(command.requestId, command.request)
        sendToPanel(tabId, {
          type: 'API_RESPONSE',
          requestId: command.requestId,
          response,
        })
      } catch (err) {
        sendToPanel(tabId, {
          type: 'API_ERROR',
          requestId: command.requestId,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
      break

    case 'API_REQUEST_CANCEL':
      cancelApiRequest(command.requestId)
      break

    // Cookie commands
    case 'COOKIES_GET_ALL': {
      const cookies = await getAllCookies(command.domain)
      sendToPanel(tabId, { type: 'COOKIES_LIST', cookies })
      break
    }

    case 'COOKIE_SET': {
      const result = await setCookie(command.params)
      sendToPanel(tabId, { type: 'COOKIE_UPDATED', success: result.success, error: result.error })
      // Refresh cookie list
      const updatedCookies = await getAllCookies()
      sendToPanel(tabId, { type: 'COOKIES_LIST', cookies: updatedCookies })
      break
    }

    case 'COOKIE_REMOVE': {
      const result = await removeCookie(command.params)
      sendToPanel(tabId, { type: 'COOKIE_REMOVED', success: result.success, error: result.error })
      const remaining = await getAllCookies()
      sendToPanel(tabId, { type: 'COOKIES_LIST', cookies: remaining })
      break
    }

    case 'COOKIES_CLEAR_DOMAIN': {
      const result = await clearDomainCookies(command.domain)
      sendToPanel(tabId, { type: 'COOKIES_CLEARED', domain: command.domain, success: result.success })
      const afterClear = await getAllCookies()
      sendToPanel(tabId, { type: 'COOKIES_LIST', cookies: afterClear })
      break
    }

    // Header override commands
    case 'HEADER_OVERRIDES_SYNC':
      updateHeaderOverrideRules(tabId, command.rules)
      break

    case 'HEADER_OVERRIDES_TOGGLE':
      setHeaderOverrideEnabled(tabId, command.enabled)
      getFeatureState(tabId).headers = command.enabled
      updateBadge(tabId)
      notifyContentScript(tabId)
      break

    case 'OVERLAY_TOGGLE':
      setOverlayEnabled(tabId, command.enabled)
      chrome.tabs.sendMessage(tabId, {
        source: 'reqx',
        type: 'OVERLAY_TOGGLE',
        enabled: command.enabled,
      }).catch(() => {})
      break
  }
})

// Cleanup when DevTools panel closes (port disconnects)
// Disable all features so the debugger detaches and overlay/badge are cleared.
// When DevTools re-opens, useInitialStateSync will restore persisted state.
setDisconnectHandler((tabId: number) => {
  console.log(`[ReqX] Panel closed for tab ${tabId}, disabling all features`)
  cleanupSession(tabId)
  tabFeatureState.delete(tabId)
  // Notify content script to dismiss overlay (animate out)
  // Don't send overlay: false so overlayEnabled persists for next open
  chrome.tabs.sendMessage(tabId, {
    source: 'reqx',
    type: 'STATUS_UPDATE',
    features: { intercept: false, mock: false, headers: false },
  }).catch(() => {})
  // Clear badge
  chrome.action.setBadgeText({ text: '', tabId }).catch(() => {})
  chrome.action.setTitle({ title: 'ReqX', tabId }).catch(() => {})
})

// Re-attach debugger and resend state after page refresh/navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && tabFeatureState.has(tabId)) {
    const state = tabFeatureState.get(tabId)!
    // Re-attach debugger if any feature is active (Chrome detaches on navigation)
    if (state.intercept || state.mock || state.headers) {
      console.log(`[ReqX] Page loaded, re-attaching debugger for tab ${tabId}`)
      reattachDebugger(tabId)
    }
    notifyContentScript(tabId)
  }
})

// Cleanup on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  cleanupSession(tabId)
  tabFeatureState.delete(tabId)
  cleanupOverlayState(tabId)
})
