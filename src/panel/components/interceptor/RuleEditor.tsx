import { useState } from 'react'
import type { InterceptRule } from '@/shared/types/intercept-rule'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import { RuleMatchConfig } from './RuleMatchConfig'
import { RuleActionConfig } from './RuleActionConfig'
import { useInterceptorStore } from '../../stores/interceptor-store'

interface RuleEditorProps {
  rule: InterceptRule
  onClose: () => void
}

export function RuleEditor({ rule, onClose }: RuleEditorProps) {
  const updateRule = useInterceptorStore((s) => s.updateRule)
  const [draft, setDraft] = useState<InterceptRule>({ ...rule })

  const handleSave = () => {
    updateRule(draft.id, draft)
    onClose()
  }

  return (
    <div className="flex h-full flex-col border-l">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-medium">Edit Rule</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          <div className="space-y-2">
            <Label className="text-xs">Rule Name</Label>
            <Input
              className="h-8 text-xs"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="My rule"
            />
          </div>

          <Separator />

          <div>
            <h4 className="text-xs font-medium mb-3">Match Condition</h4>
            <RuleMatchConfig
              match={draft.match}
              onChange={(match) => setDraft({ ...draft, match })}
            />
          </div>

          <Separator />

          <div>
            <h4 className="text-xs font-medium mb-3">Action</h4>
            <RuleActionConfig
              action={draft.action}
              matchOperator={draft.match.operator}
              onChange={(action) => setDraft({ ...draft, action })}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
