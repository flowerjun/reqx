import { useEffect } from 'react'
import { useBackgroundPort } from '../../hooks/use-background-port'
import { useNetworkEvents } from '../../hooks/use-network-events'
import { useRuleActivityEvents } from '../../hooks/use-rule-activity-events'
import { useThemeStore } from '../../stores/theme-store'
import { useInterceptorStore } from '../../stores/interceptor-store'
import { useMockStore } from '../../stores/mock-store'
import { useHeaderOverrideStore } from '../../stores/header-override-store'
import { RuleActivityToast } from './RuleActivityToast'
import type { BackgroundEvent } from '@/shared/types/messages'

export function RuleActivityNotifier() {
  const handleNetworkEvent = useNetworkEvents()
  const handleActivityEvent = useRuleActivityEvents()
  const pageOverlay = useThemeStore((s) => s.pageOverlay)

  const interceptorEnabled = useInterceptorStore((s) => s.enabled)
  const interceptorRules = useInterceptorStore((s) => s.rules)
  const mockEnabled = useMockStore((s) => s.enabled)
  const mockRules = useMockStore((s) => s.rules)
  const headerEnabled = useHeaderOverrideStore((s) => s.enabled)
  const headerRules = useHeaderOverrideStore((s) => s.rules)

  const handleEvent = (event: BackgroundEvent) => {
    handleNetworkEvent(event)
    handleActivityEvent(event)
  }

  const { sendCommand } = useBackgroundPort(handleEvent)

  // Sync ALL feature states to service worker on mount
  // This ensures SW has correct state after panel open/reconnect/SW restart
  useEffect(() => {
    sendCommand({ type: 'OVERLAY_TOGGLE', enabled: pageOverlay })
    sendCommand({ type: 'INTERCEPTOR_TOGGLE', enabled: interceptorEnabled })
    if (interceptorEnabled) {
      sendCommand({ type: 'INTERCEPTOR_RULES_SYNC', rules: interceptorRules })
    }
    sendCommand({ type: 'MOCK_TOGGLE', enabled: mockEnabled })
    if (mockEnabled) {
      sendCommand({ type: 'MOCK_RULES_SYNC', rules: mockRules })
    }
    sendCommand({ type: 'HEADER_OVERRIDES_TOGGLE', enabled: headerEnabled })
    if (headerEnabled) {
      sendCommand({ type: 'HEADER_OVERRIDES_SYNC', rules: headerRules })
    }
    // Only run on mount - individual views handle subsequent changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync overlay preference when it changes
  useEffect(() => {
    sendCommand({ type: 'OVERLAY_TOGGLE', enabled: pageOverlay })
  }, [pageOverlay])

  return <RuleActivityToast />
}
