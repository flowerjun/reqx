import { PanelLeftClose, PanelLeftOpen, AlertTriangle } from 'lucide-react'
import { useUiStore } from '../../stores/ui-store'
import { useInterceptorStore } from '../../stores/interceptor-store'
import { useMockStore } from '../../stores/mock-store'
import { useHeaderOverrideStore } from '../../stores/header-override-store'
import { Button } from '../ui/button'

export function Header() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const interceptorEnabled = useInterceptorStore((s) => s.enabled)
  const mockEnabled = useMockStore((s) => s.enabled)
  const headerEnabled = useHeaderOverrideStore((s) => s.enabled)
  const anyActive = interceptorEnabled || mockEnabled || headerEnabled

  return (
    <header className="flex h-11 items-center border-b px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
        {anyActive && (
          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            {interceptorEnabled && (
              <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400">
                Interceptor
              </span>
            )}
            {mockEnabled && (
              <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Mocking
              </span>
            )}
            {headerEnabled && (
              <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                Headers
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
