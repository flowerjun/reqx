import { useEffect } from 'react'
import { Shield, Database, FileText, X } from 'lucide-react'
import { useNotificationStore, type RuleNotification } from '../../stores/notification-store'
import { cn } from '@/lib/utils'

const TOAST_DURATION = 4000

const typeConfig: Record<RuleNotification['type'], {
  icon: typeof Shield
  label: string
  color: string
  bg: string
}> = {
  intercepted: {
    icon: Shield,
    label: 'Intercepted',
    color: 'text-orange-500',
    bg: 'border-orange-500/30 bg-orange-500/5',
  },
  mocked: {
    icon: Database,
    label: 'Mocked',
    color: 'text-blue-500',
    bg: 'border-blue-500/30 bg-blue-500/5',
  },
  'header-overridden': {
    icon: FileText,
    label: 'Headers Modified',
    color: 'text-purple-500',
    bg: 'border-purple-500/30 bg-purple-500/5',
  },
}

function ToastItem({ notification }: { notification: RuleNotification }) {
  const removeNotification = useNotificationStore((s) => s.removeNotification)
  const config = typeConfig[notification.type]
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(() => {
      removeNotification(notification.id)
    }, TOAST_DURATION)
    return () => clearTimeout(timer)
  }, [notification.id, removeNotification])

  // Truncate URL for display
  const displayUrl = (() => {
    try {
      const u = new URL(notification.url)
      const path = u.pathname + u.search
      return path.length > 60 ? path.slice(0, 57) + '...' : path
    } catch {
      return notification.url.length > 60
        ? notification.url.slice(0, 57) + '...'
        : notification.url
    }
  })()

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border px-3 py-2 shadow-sm animate-in slide-in-from-right-5 fade-in duration-200',
        config.bg,
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', config.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[10px] font-semibold uppercase tracking-wider', config.color)}>
            {config.label}
          </span>
          <span className="text-[10px] font-medium text-foreground truncate">
            {notification.ruleName}
          </span>
        </div>
        {notification.ruleDetail && (
          <p className="text-[9px] text-muted-foreground mt-0.5">{notification.ruleDetail}</p>
        )}
        <p className="text-[9px] text-muted-foreground/70 font-mono truncate mt-0.5">
          {displayUrl}
        </p>
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function RuleActivityToast() {
  const notifications = useNotificationStore((s) => s.notifications)

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col gap-1.5 w-72 pointer-events-auto">
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} />
      ))}
    </div>
  )
}
