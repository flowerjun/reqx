import { PORT_NAME } from '@/shared/constants'
import type { PanelCommand, BackgroundEvent } from '@/shared/types/messages'

type PortEntry = {
  port: chrome.runtime.Port
  tabId: number
}

const connectedPorts = new Map<number, PortEntry>()

let onCommandHandler: ((tabId: number, command: PanelCommand) => void) | null = null
let onDisconnectHandler: ((tabId: number) => void) | null = null

export function setCommandHandler(handler: (tabId: number, command: PanelCommand) => void) {
  onCommandHandler = handler
}

export function setDisconnectHandler(handler: (tabId: number) => void) {
  onDisconnectHandler = handler
}

export function initMessageRouter() {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== PORT_NAME) return

    let tabId = -1

    port.onMessage.addListener((msg: PanelCommand) => {
      if (msg.type === 'INIT') {
        tabId = msg.tabId
        connectedPorts.set(tabId, { port, tabId })
        console.log(`[ReqX] Panel connected for tab ${tabId}`)
      }

      if (tabId !== -1 && onCommandHandler) {
        onCommandHandler(tabId, msg)
      }
    })

    port.onDisconnect.addListener(() => {
      if (tabId !== -1) {
        // Only remove if THIS port is still the current mapping
        // Prevents race condition where new port connects before old one disconnects
        const current = connectedPorts.get(tabId)
        if (current?.port === port) {
          connectedPorts.delete(tabId)
          console.log(`[ReqX] Panel disconnected for tab ${tabId}`)
          onDisconnectHandler?.(tabId)
        }
      }
    })
  })
}

export function sendToPanel(tabId: number, event: BackgroundEvent) {
  const entry = connectedPorts.get(tabId)
  if (entry) {
    try {
      entry.port.postMessage(event)
    } catch {
      connectedPorts.delete(tabId)
    }
  }
}

export function broadcastToAllPanels(event: BackgroundEvent) {
  for (const [tabId] of connectedPorts) {
    sendToPanel(tabId, event)
  }
}
