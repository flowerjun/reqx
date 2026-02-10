import { useRef, useState } from 'react'
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react'
import { useTheme } from '../../hooks/use-theme'
import { useThemeStore } from '../../stores/theme-store'
import { useInterceptorStore } from '../../stores/interceptor-store'
import { useMockStore } from '../../stores/mock-store'
import { useHeaderOverrideStore } from '../../stores/header-override-store'
import { useCollectionStore } from '../../stores/collection-store'
import { useBackgroundPort } from '../../hooks/use-background-port'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import type { Theme } from '../../stores/theme-store'

const EXPORT_VERSION = 1

interface ExportData {
  version: number
  exportedAt: string
  interceptor: { rules: unknown[]; enabled: boolean }
  mock: { rules: unknown[]; enabled: boolean }
  headerOverrides: { rules: unknown[]; enabled: boolean }
  collections: { collections: unknown[]; environments: unknown[]; activeEnvironmentId: string | null }
  theme: Theme
}

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const pageOverlay = useThemeStore((s) => s.pageOverlay)
  const setPageOverlay = useThemeStore((s) => s.setPageOverlay)
  const { sendCommand } = useBackgroundPort()
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOverlayToggle = (checked: boolean) => {
    setPageOverlay(checked)
    sendCommand({ type: 'OVERLAY_TOGGLE', enabled: checked })
  }

  const handleExport = () => {
    const interceptorState = useInterceptorStore.getState()
    const mockState = useMockStore.getState()
    const headerState = useHeaderOverrideStore.getState()
    const collectionState = useCollectionStore.getState()

    const data: ExportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      interceptor: { rules: interceptorState.rules, enabled: interceptorState.enabled },
      mock: { rules: mockState.rules, enabled: mockState.enabled },
      headerOverrides: { rules: headerState.rules, enabled: headerState.enabled },
      collections: {
        collections: collectionState.collections,
        environments: collectionState.environments,
        activeEnvironmentId: collectionState.activeEnvironmentId,
      },
      theme,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reqx-settings-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = JSON.parse(text) as ExportData

        if (!data.version || data.version > EXPORT_VERSION) {
          setImportStatus({ type: 'error', message: 'Unsupported file version.' })
          return
        }

        if (data.interceptor?.rules) {
          useInterceptorStore.setState({
            rules: data.interceptor.rules as never[],
            enabled: data.interceptor.enabled ?? false,
            editingRuleId: null,
          })
        }
        if (data.mock?.rules) {
          useMockStore.setState({
            rules: data.mock.rules as never[],
            enabled: data.mock.enabled ?? false,
            editingRuleId: null,
          })
        }
        if (data.headerOverrides?.rules) {
          useHeaderOverrideStore.setState({
            rules: data.headerOverrides.rules as never[],
            enabled: data.headerOverrides.enabled ?? false,
            editingRuleId: null,
          })
        }
        if (data.collections) {
          useCollectionStore.setState({
            collections: (data.collections.collections ?? []) as never[],
            environments: (data.collections.environments ?? []) as never[],
            activeEnvironmentId: data.collections.activeEnvironmentId ?? null,
          })
        }
        if (data.theme) {
          setTheme(data.theme)
        }

        setImportStatus({ type: 'success', message: 'Settings imported successfully.' })
      } catch {
        setImportStatus({ type: 'error', message: 'Invalid file format.' })
      }
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImport(file)
      e.target.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="text-lg font-semibold mb-6">Settings</h2>

      <div className="space-y-8">
        {/* Theme */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Theme</Label>
          <RadioGroup
            value={theme}
            onValueChange={(v) => setTheme(v as Theme)}
            className="flex gap-4"
          >
            {(['light', 'dark', 'system'] as const).map((t) => (
              <div key={t} className="flex items-center space-x-2">
                <RadioGroupItem value={t} id={`theme-${t}`} />
                <Label htmlFor={`theme-${t}`} className="capitalize cursor-pointer">
                  {t}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Page Overlay */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Page Overlay</Label>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Show an overlay on the page when interception, mocking, or header rules are active.
              </p>
            </div>
            <Switch
              checked={pageOverlay}
              onCheckedChange={handleOverlayToggle}
            />
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Data Management</Label>
          <p className="text-xs text-muted-foreground">
            Export all rules, collections, and settings as a JSON file, or import from a previously exported file.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExport}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Import Settings
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {importStatus && (
            <div
              className={`flex items-center gap-2 text-xs mt-2 ${
                importStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {importStatus.message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
