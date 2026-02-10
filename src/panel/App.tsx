import { useCallback, useEffect, useRef } from 'react'
import { TooltipProvider } from './components/ui/tooltip'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { RuleActivityNotifier } from './components/shared/RuleActivityNotifier'
import { ResizableDivider } from './components/shared/ResizableDivider'
import { useUiStore } from './stores/ui-store'
import { useTheme } from './hooks/use-theme'
import { useInitialStateSync } from './hooks/use-initial-state-sync'

// Lazy-loaded view placeholders (will be replaced by actual views)
import { InterceptorView } from './components/interceptor/InterceptorView'
import { ApiClientView } from './components/api-client/ApiClientView'
import { MockView } from './components/mock/MockView'
import { CollectionsView } from './components/collections/CollectionsView'
import { TypeExtractorView } from './components/type-extractor/TypeExtractorView'
import { CookieView } from './components/cookies/CookieView'
import { HeaderOverrideView } from './components/headers/HeaderOverrideView'
import { SettingsView } from './components/settings/SettingsView'

const panelComponents = {
  interceptor: InterceptorView,
  'api-client': ApiClientView,
  mocking: MockView,
  collections: CollectionsView,
  'type-extractor': TypeExtractorView,
  cookies: CookieView,
  headers: HeaderOverrideView,
  settings: SettingsView,
} as const

const SIDEBAR_MIN = 160
const SIDEBAR_MAX = 320

export function App() {
  useTheme()
  useInitialStateSync()
  const activePanel = useUiStore((s) => s.activePanel)
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth)
  const setSidebarResizing = useUiStore((s) => s.setSidebarResizing)
  const ActiveView = panelComponents[activePanel]
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (sidebarCollapsed) return
    e.preventDefault()
    isDragging.current = true
    setSidebarResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [sidebarCollapsed, setSidebarResizing])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = Math.round(e.clientX - rect.left)
      setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, newWidth)))
    }
    const handleMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      setSidebarResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [setSidebarWidth, setSidebarResizing])

  return (
    <TooltipProvider delayDuration={300}>
      <div ref={containerRef} className="flex h-full">
        <Sidebar />
        {!sidebarCollapsed && <ResizableDivider onMouseDown={handleMouseDown} />}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-auto">
            <ActiveView />
          </main>
        </div>
      </div>
      <RuleActivityNotifier />
    </TooltipProvider>
  )
}
