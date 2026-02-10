import { useEffect, useCallback, useEffectEvent } from 'react'
import { PORT_NAME } from '@/shared/constants'
import type { PanelCommand, BackgroundEvent } from '@/shared/types/messages'

type EventHandler = (event: BackgroundEvent) => void

const RECONNECT_DELAY = 500
const MAX_RECONNECT_ATTEMPTS = 5

// Singleton port shared across all hook instances in the panel
let sharedPort: chrome.runtime.Port | null = null
let reconnectCount = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const eventListeners = new Set<EventHandler>()
let refCount = 0

function connectPort() {
  if (typeof chrome === 'undefined' || !chrome.runtime?.connect) {
    console.warn('[ReqX] Not running in Chrome extension context')
    return
  }

  try {
    const port = chrome.runtime.connect({ name: PORT_NAME })
    sharedPort = port
    reconnectCount = 0

    const tabId = chrome.devtools?.inspectedWindow?.tabId ?? -1
    port.postMessage({ type: 'INIT', tabId } satisfies PanelCommand)

    port.onMessage.addListener((msg: BackgroundEvent) => {
      for (const handler of eventListeners) {
        handler(msg)
      }
    })

    port.onDisconnect.addListener(() => {
      sharedPort = null
      if (refCount > 0 && reconnectCount < MAX_RECONNECT_ATTEMPTS) {
        reconnectCount++
        reconnectTimer = setTimeout(connectPort, RECONNECT_DELAY)
      }
    })
  } catch {
    sharedPort = null
  }
}

function ensurePort() {
  if (!sharedPort) {
    connectPort()
  }
}

export function useBackgroundPort(onEvent?: EventHandler) {
  const stableHandler = useEffectEvent((msg: BackgroundEvent) => {
    onEvent?.(msg)
  })

  useEffect(() => {
    refCount++
    ensurePort()

    if (onEvent) {
      eventListeners.add(stableHandler)
    }

    return () => {
      refCount--
      if (onEvent) {
        eventListeners.delete(stableHandler)
      }
      // Disconnect port when no more consumers
      if (refCount === 0) {
        if (reconnectTimer) {
          clearTimeout(reconnectTimer)
          reconnectTimer = null
        }
        if (sharedPort) {
          sharedPort.disconnect()
          sharedPort = null
        }
      }
    }
  }, [])

  const sendCommand = useCallback((command: PanelCommand) => {
    sharedPort?.postMessage(command)
  }, [])

  return { sendCommand }
}
