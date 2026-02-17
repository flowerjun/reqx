import { useEffect, useState } from 'react'
import { Clock, Trash2, Save, AlertCircle } from 'lucide-react'
import { useHistoryStore } from '../../stores/history-store'
import { useApiClientStore } from '../../stores/api-client-store'
import { useUiStore } from '../../stores/ui-store'
import { SaveToCollectionDialog } from '../api-client/SaveToCollectionDialog'
import { EmptyState } from '../shared/EmptyState'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { cn } from '@/lib/utils'
import { METHOD_COLORS } from '@/shared/constants'
import type { HistoryEntry } from '@/shared/types/api-request'

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '-'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function getStatusColor(code: number | null): string {
  if (code === null) return 'text-destructive'
  if (code < 300) return 'text-green-500'
  if (code < 400) return 'text-amber-500'
  return 'text-red-500'
}

export function HistoryList() {
  const { entries, loaded, loadHistory, removeEntry, clearHistory } = useHistoryStore()
  const setActivePanel = useUiStore((s) => s.setActivePanel)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [saveEntry, setSaveEntry] = useState<HistoryEntry | null>(null)

  useEffect(() => {
    if (!loaded) loadHistory()
  }, [loaded, loadHistory])

  const handleLoadEntry = (entry: HistoryEntry) => {
    const store = useApiClientStore.getState()
    store.reset()
    useApiClientStore.setState({
      method: entry.method,
      url: entry.url,
      queryParams: entry.queryParams.length > 0
        ? [...entry.queryParams, { key: '', value: '', enabled: true }]
        : [{ key: '', value: '', enabled: true }],
      headers: entry.headers.length > 0
        ? [...entry.headers, { key: '', value: '', enabled: true }]
        : [{ key: '', value: '', enabled: true }],
      bodyType: entry.bodyType,
      bodyContent: entry.bodyContent,
      authType: entry.authType,
      authConfig: entry.authConfig,
      withCredentials: entry.withCredentials ?? false,
    })
    setActivePanel('api-client')
  }

  const handleSaveEntry = (entry: HistoryEntry) => {
    useApiClientStore.setState({
      method: entry.method,
      url: entry.url,
      queryParams: entry.queryParams,
      headers: entry.headers,
      bodyType: entry.bodyType,
      bodyContent: entry.bodyContent,
      authType: entry.authType,
      authConfig: entry.authConfig,
      withCredentials: entry.withCredentials ?? false,
      loadedFromCollectionId: null,
      loadedFromRequestId: null,
    })
    setSaveEntry(entry)
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No history"
        description="Send requests from the API Client to see them here."
      />
    )
  }

  return (
    <>
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-[10px] text-muted-foreground">{entries.length} entries</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-muted-foreground"
          onClick={() => setShowClearConfirm(true)}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <div className="divide-y">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleLoadEntry(entry)}
          >
            <span className={cn('text-[10px] font-mono font-bold shrink-0 w-12', METHOD_COLORS[entry.method])}>
              {entry.method}
            </span>
            <span className="text-xs truncate flex-1 font-mono">{entry.url}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {entry.statusCode !== null ? (
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getStatusColor(entry.statusCode))}>
                  {entry.statusCode}
                </Badge>
              ) : (
                <AlertCircle className="h-3 w-3 text-destructive" />
              )}
              <span className="text-[10px] text-muted-foreground w-12 text-right">
                {formatDuration(entry.duration)}
              </span>
              <span className="text-[10px] text-muted-foreground w-12 text-right">
                {formatRelativeTime(entry.timestamp)}
              </span>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSaveEntry(entry)
                    }}
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save to Collection</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeEntry(entry.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear History"
        description="Delete all history entries? This action cannot be undone."
        confirmLabel="Clear All"
        variant="destructive"
        onConfirm={clearHistory}
      />

      <SaveToCollectionDialog
        open={!!saveEntry}
        onOpenChange={(open) => { if (!open) setSaveEntry(null) }}
      />
    </>
  )
}
