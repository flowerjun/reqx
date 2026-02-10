import { useEffect, useRef } from 'react'
import { useBackgroundPort } from './use-background-port'
import { useInterceptorStore } from '../stores/interceptor-store'
import { useMockStore } from '../stores/mock-store'
import { useHeaderOverrideStore } from '../stores/header-override-store'

/**
 * Syncs all persisted feature states to the service worker on panel open.
 * The service worker creates a fresh session per tab, so persisted toggle/rules
 * must be re-sent whenever the DevTools panel initializes.
 */
export function useInitialStateSync() {
  const { sendCommand } = useBackgroundPort()
  const hasSynced = useRef(false)

  useEffect(() => {
    if (hasSynced.current) return
    hasSynced.current = true

    const interceptor = useInterceptorStore.getState()
    if (interceptor.enabled) {
      sendCommand({ type: 'INTERCEPTOR_TOGGLE', enabled: true })
      sendCommand({ type: 'INTERCEPTOR_RULES_SYNC', rules: interceptor.rules })
    }

    const mock = useMockStore.getState()
    if (mock.enabled) {
      sendCommand({ type: 'MOCK_TOGGLE', enabled: true })
      sendCommand({ type: 'MOCK_RULES_SYNC', rules: mock.rules })
    }

    const headers = useHeaderOverrideStore.getState()
    if (headers.enabled) {
      sendCommand({ type: 'HEADER_OVERRIDES_TOGGLE', enabled: true })
      sendCommand({ type: 'HEADER_OVERRIDES_SYNC', rules: headers.rules })
    }
  }, [sendCommand])
}
