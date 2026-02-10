import { useRef, useState } from 'react'
import { Trash2, GripVertical } from 'lucide-react'
import type { InterceptRule } from '@/shared/types/intercept-rule'
import { useInterceptorStore } from '../../stores/interceptor-store'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { cn } from '@/lib/utils'

const actionLabels: Record<string, string> = {
  block: 'Block',
  delay: 'Delay',
  redirect: 'Redirect',
  'modify-headers': 'Headers',
}

interface RuleListProps {
  rules: InterceptRule[]
  selectedId: string | null
  onSelect: (id: string) => void
  globalEnabled?: boolean
}

export function RuleList({ rules, selectedId, onSelect, globalEnabled }: RuleListProps) {
  const { toggleRule, removeRule, reorderRules } = useInterceptorStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
    ;(e.currentTarget as HTMLElement).style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const fromIndex = dragIndexRef.current
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragOverIndex(null)
      return
    }
    const reordered = [...rules]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    reorderRules(reordered)
    setDragOverIndex(null)
    dragIndexRef.current = null
  }

  return (
    <>
      <div className="divide-y">
        {rules.map((rule, index) => (
          <div
            key={rule.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors',
              selectedId === rule.id && 'bg-muted',
              dragOverIndex === index && dragIndexRef.current !== index && 'border-t-2 border-t-primary',
            )}
            onClick={() => onSelect(rule.id)}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0 cursor-grab active:cursor-grabbing" />

            <Switch
              checked={rule.enabled}
              onCheckedChange={() => toggleRule(rule.id)}
              onClick={(e) => e.stopPropagation()}
              className="scale-75"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium truncate">{rule.name || 'Unnamed Rule'}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {actionLabels[rule.action.type] ?? rule.action.type}
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
        title="Delete Rule"
        description="Are you sure you want to delete this rule? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) removeRule(deleteId)
        }}
      />
    </>
  )
}
