import type { BackgroundEvent } from '@/shared/types/messages'
import { useInterceptorStore } from '../stores/interceptor-store'
import { useMockStore } from '../stores/mock-store'
import { useHeaderOverrideStore } from '../stores/header-override-store'
import { useNotificationStore } from '../stores/notification-store'

const actionLabels: Record<string, string> = {
  block: 'Block',
  delay: 'Delay',
  redirect: 'Redirect',
  'modify-headers': 'Modify Headers',
}

export function useRuleActivityEvents() {
  const interceptRules = useInterceptorStore((s) => s.rules)
  const mockRules = useMockStore((s) => s.rules)
  const headerRules = useHeaderOverrideStore((s) => s.rules)
  const addNotification = useNotificationStore((s) => s.addNotification)

  return (event: BackgroundEvent) => {
    switch (event.type) {
      case 'REQUEST_INTERCEPTED': {
        const rule = interceptRules.find((r) => r.id === event.ruleId)
        if (rule) {
          const details: string[] = [actionLabels[rule.action.type] ?? rule.action.type]
          if (rule.action.delayMs) details.push(`${rule.action.delayMs}ms`)
          if (rule.action.redirectUrl) details.push(`-> ${rule.action.redirectUrl}`)

          addNotification({
            type: 'intercepted',
            ruleName: rule.name || 'Unnamed Rule',
            ruleDetail: details.join(' | '),
            url: event.url,
          })
        }
        break
      }

      case 'REQUEST_MOCKED': {
        const rule = mockRules.find((r) => r.id === event.ruleId)
        if (rule) {
          addNotification({
            type: 'mocked',
            ruleName: rule.name || 'Unnamed Mock',
            ruleDetail: `${rule.response.statusCode} ${rule.response.bodyType}`,
            url: event.url,
          })
        }
        break
      }

      case 'REQUEST_HEADER_OVERRIDDEN': {
        const rule = headerRules.find((r) => r.id === event.ruleId)
        if (rule) {
          addNotification({
            type: 'header-overridden',
            ruleName: rule.name || 'Unnamed Override',
            ruleDetail: `${rule.modifications.length} modification${rule.modifications.length !== 1 ? 's' : ''}`,
            url: event.url,
          })
        }
        break
      }
    }
  }
}
