import { Activity, Trash2 } from 'lucide-react'
import { useNetworkStore } from '../../stores/network-store'
import { StatusBadge } from '../shared/StatusBadge'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import { EmptyState } from '../shared/EmptyState'
import { cn } from '@/lib/utils'
import { METHOD_COLORS } from '@/shared/constants'

export function NetworkMonitor() {
  const { entries, selectedEntryId, selectEntry, clearEntries } = useNetworkStore()

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No network activity"
        description="Network requests will appear here when intercepting is enabled."
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs text-muted-foreground">{entries.length} requests</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearEntries}>
          <Trash2 className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                'flex items-center gap-3 px-3 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors text-xs',
                selectedEntryId === entry.id && 'bg-muted',
              )}
              onClick={() => selectEntry(entry.id)}
            >
              <span className={cn('font-mono font-medium w-12 shrink-0', METHOD_COLORS[entry.method] ?? '')}>
                {entry.method}
              </span>

              {entry.statusCode > 0 ? (
                <StatusBadge statusCode={entry.statusCode} />
              ) : (
                <Badge variant="outline" className="text-[10px]">pending</Badge>
              )}

              <span className="flex-1 truncate font-mono text-[11px] text-muted-foreground">
                {entry.url}
              </span>

              {entry.mockedBy && (
                <Badge variant="secondary" className="text-[10px] shrink-0">mocked</Badge>
              )}
              {entry.interceptedBy && (
                <Badge variant="secondary" className="text-[10px] shrink-0">intercepted</Badge>
              )}

              {entry.duration > 0 && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {entry.duration}ms
                </span>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
