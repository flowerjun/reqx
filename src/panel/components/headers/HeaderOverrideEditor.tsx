import { useState } from 'react'
import { Save, X, Plus, Trash2 } from 'lucide-react'
import type { HeaderOverrideRule, HeaderModification } from '@/shared/types/header-override'
import { useHeaderOverrideStore } from '../../stores/header-override-store'
import { HTTP_METHODS, MATCH_OPERATORS } from '@/shared/constants'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Switch } from '../ui/switch'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'

interface HeaderOverrideEditorProps {
  rule: HeaderOverrideRule
  onClose: () => void
}

export function HeaderOverrideEditor({ rule, onClose }: HeaderOverrideEditorProps) {
  const { updateRule } = useHeaderOverrideStore()
  const [draft, setDraft] = useState<HeaderOverrideRule>({ ...rule, modifications: rule.modifications.map((m) => ({ ...m })) })

  const handleSave = () => {
    updateRule(draft.id, draft)
    onClose()
  }

  const addModification = () => {
    setDraft({
      ...draft,
      modifications: [
        ...draft.modifications,
        { target: 'request', operation: 'set', name: '', value: '', enabled: true },
      ],
    })
  }

  const updateMod = (index: number, updates: Partial<HeaderModification>) => {
    const mods = draft.modifications.map((m, i) => (i === index ? { ...m, ...updates } : m))
    setDraft({ ...draft, modifications: mods })
  }

  const removeMod = (index: number) => {
    setDraft({ ...draft, modifications: draft.modifications.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex h-full flex-col border-l">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs font-medium">Edit Override Rule</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Rule Name */}
          <div className="space-y-2">
            <Label className="text-xs">Rule Name</Label>
            <Input
              className="h-8 text-xs"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="My Override Rule"
            />
          </div>

          <Separator />

          {/* Match Condition */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Match Condition</Label>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground">Operator</Label>
              <Select
                value={draft.match.operator}
                onValueChange={(v) =>
                  setDraft({ ...draft, match: { ...draft.match, operator: v as typeof draft.match.operator } })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_OPERATORS.map((op) => (
                    <SelectItem key={op} value={op} className="text-xs">
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground">URL Pattern</Label>
              <Input
                className="h-8 text-xs font-mono"
                value={draft.match.value}
                onChange={(e) => setDraft({ ...draft, match: { ...draft.match, value: e.target.value } })}
                placeholder="*api.example.com*"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground">Methods (empty = all)</Label>
              <div className="flex flex-wrap gap-2">
                {HTTP_METHODS.map((method) => (
                  <label key={method} className="flex items-center gap-1 text-[10px] cursor-pointer">
                    <Checkbox
                      checked={draft.match.methods?.includes(method) ?? false}
                      onCheckedChange={(checked) => {
                        const current = draft.match.methods ?? []
                        const next = checked ? [...current, method] : current.filter((m) => m !== method)
                        setDraft({
                          ...draft,
                          match: { ...draft.match, methods: next.length > 0 ? next : undefined },
                        })
                      }}
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Header Modifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Header Modifications</Label>
              <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={addModification}>
                <Plus className="h-3 w-3 mr-0.5" />
                Add
              </Button>
            </div>

            {draft.modifications.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-4">
                No modifications. Click "Add" to create one.
              </p>
            )}

            {draft.modifications.map((mod, index) => (
              <div key={index} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={mod.enabled}
                      onCheckedChange={(checked) => updateMod(index, { enabled: checked })}
                      className="scale-75"
                    />
                    <Badge
                      variant={mod.target === 'request' ? 'default' : 'secondary'}
                      className="h-4 px-1.5 text-[9px]"
                    >
                      {mod.target}
                    </Badge>
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                      {mod.operation}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMod(index)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={mod.target}
                    onValueChange={(v) => updateMod(index, { target: v as HeaderModification['target'] })}
                  >
                    <SelectTrigger className="h-7 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="request" className="text-xs">Request</SelectItem>
                      <SelectItem value="response" className="text-xs">Response</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={mod.operation}
                    onValueChange={(v) => updateMod(index, { operation: v as HeaderModification['operation'] })}
                  >
                    <SelectTrigger className="h-7 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set" className="text-xs">Set</SelectItem>
                      <SelectItem value="remove" className="text-xs">Remove</SelectItem>
                      <SelectItem value="append" className="text-xs">Append</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  className="h-7 text-[10px] font-mono"
                  placeholder="Header-Name"
                  value={mod.name}
                  onChange={(e) => updateMod(index, { name: e.target.value })}
                />
                {mod.operation !== 'remove' && (
                  <Input
                    className="h-7 text-[10px] font-mono"
                    placeholder="Header value"
                    value={mod.value}
                    onChange={(e) => updateMod(index, { value: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
