import { useState } from 'react'
import { Trash2, FileText } from 'lucide-react'
import type { HeaderOverrideRule } from '@/shared/types/header-override'
import { useHeaderOverrideStore } from '../../stores/header-override-store'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Badge } from '../ui/badge'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { cn } from '@/lib/utils'

interface HeaderOverrideListProps {
  rules: HeaderOverrideRule[]
  selectedId: string | null
  onSelect: (id: string) => void
  globalEnabled?: boolean
}

export function HeaderOverrideList({ rules, selectedId, onSelect, globalEnabled }: HeaderOverrideListProps) {
  const { toggleRule, removeRule } = useHeaderOverrideStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <>
      <div className="divide-y">
        {rules.map((rule) => (
          <div
            key={rule.id}
            onClick={() => onSelect(rule.id)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-accent/50',
              selectedId === rule.id && 'bg-accent',
            )}
          >
            <Switch
              checked={rule.enabled}
              onCheckedChange={() => toggleRule(rule.id)}
              className="scale-75"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium truncate">{rule.name}</span>
                <Badge variant="outline" className="h-4 px-1 text-[9px] shrink-0">
                  {rule.modifications.length} mod{rule.modifications.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground truncate font-mono">
                  {rule.match.operator}: {rule.match.value || '(empty)'}
                </span>
              </div>
            </div>

            {globalEnabled && rule.enabled && (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteId(rule.id)
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Rule"
        description="Are you sure you want to delete this header override rule? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) removeRule(deleteId)
          setDeleteId(null)
        }}
      />
    </>
  )
}
