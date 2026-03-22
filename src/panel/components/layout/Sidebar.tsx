import { Shield,Send,Database,FolderOpen,Braces,Settings,Cookie,FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type PanelId, useUiStore } from '../../stores/ui-store'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { useI18n } from '../../hooks/use-i18n'

const navIcons: { id: PanelId; labelKey: 'interceptor' | 'apiClient' | 'mocking' | 'headers' | 'cookies' | 'collections' | 'typeExtract'; icon: typeof Shield }[] = [
  { id: 'interceptor', labelKey: 'interceptor', icon: Shield },
  { id: 'api-client', labelKey: 'apiClient', icon: Send },
  { id: 'mocking', labelKey: 'mocking', icon: Database },
  { id: 'headers', labelKey: 'headers', icon: FileText },
  { id: 'cookies', labelKey: 'cookies', icon: Cookie },
  { id: 'collections', labelKey: 'collections', icon: FolderOpen },
  { id: 'type-extractor', labelKey: 'typeExtract', icon: Braces },
]

export function Sidebar() {
  const t = useI18n()
  const { activePanel, setActivePanel, sidebarCollapsed, sidebarWidth, sidebarResizing } = useUiStore()

  return (
    <aside
      className={cn(
        'flex flex-col bg-muted/30 shrink-0 overflow-hidden',
        sidebarCollapsed && 'border-r',
      )}
      style={{
        width: sidebarCollapsed ? 56 : sidebarWidth,
        transition: sidebarResizing ? 'none' : 'width 200ms ease-in-out',
      }}
    >
      <div className="flex h-11 items-center gap-2 border-b px-3">
        <img
          src={chrome.runtime.getURL('icons/icon-128.png')}
          alt="ReqX"
          className="h-6 w-6 shrink-0 rounded-md"
        />
        {!sidebarCollapsed && (
          <span className="text-sm font-semibold tracking-tight">ReqX</span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navIcons.map(({ id, labelKey, icon: Icon }) => {
          const label = t[labelKey]
          const button = (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                activePanel === id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </button>
          )

          if (sidebarCollapsed) {
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            )
          }
          return button
        })}
      </nav>

      <div className="border-t p-2">
        {(() => {
          const settingsBtn = (
            <button
              onClick={() => setActivePanel('settings')}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                activePanel === 'settings'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{t.settings}</span>}
            </button>
          )

          if (sidebarCollapsed) {
            return (
              <Tooltip>
                <TooltipTrigger asChild>{settingsBtn}</TooltipTrigger>
                <TooltipContent side="right">{t.settings}</TooltipContent>
              </Tooltip>
            )
          }
          return settingsBtn
        })()}
      </div>
    </aside>
  )
}
