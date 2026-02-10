import { useState } from 'react'
import { Trash2, GripVertical } from 'lucide-react'
import type { MockRule } from '@/shared/types/mock-rule'
import { useMockStore } from '../../stores/mock-store'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { cn } from '@/lib/utils'

interface MockRuleListProps {
  rules: MockRule[]
  selectedId: string | null
  onSelect: (id: string) => void
  globalEnabled?: boolean
}

export function MockRuleList({ rules, selectedId, onSelect, globalEnabled }: MockRuleListProps) {
  const { toggleRule, removeRule } = useMockStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <>
      <div className="divide-y">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={cn(
              'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors',
              selectedId === rule.id && 'bg-muted',
            )}
            onClick={() => onSelect(rule.id)}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0 cursor-grab" />

            <Switch
              checked={rule.enabled}
              onCheckedChange={() => toggleRule(rule.id)}
              onClick={(e) => e.stopPropagation()}
              className="scale-75"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium truncate">{rule.name || 'Unnamed Mock'}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {rule.response.statusCode}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {rule.response.bodyType}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                {rule.match.operator}: {rule.match.value}
              </p>
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
        title="Delete Mock Rule"
        description="Are you sure you want to delete this mock rule? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) removeRule(deleteId)
        }}
      />
    </>
  )
}
