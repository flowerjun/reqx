import { useState } from 'react'
import type { MockRule } from '@/shared/types/mock-rule'
import type { KeyValuePair } from '@/shared/types/intercept-rule'
import { MATCH_OPERATORS, HTTP_METHODS, MOCK_BODY_TYPES } from '@/shared/constants'
import type { MatchOperator, HttpMethod, MockBodyType } from '@/shared/constants'
import { useMockStore } from '../../stores/mock-store'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { KeyValueTable } from '../shared/KeyValueTable'
import { CodeEditor } from '../shared/CodeEditor'
import type { EditorLanguage } from '@/lib/codemirror-setup'

interface MockRuleEditorProps {
  rule: MockRule
  onClose: () => void
}

const bodyTypeToLanguage: Record<MockBodyType, EditorLanguage> = {
  json: 'json',
  text: 'text',
  html: 'html',
}

export function MockRuleEditor({ rule, onClose }: MockRuleEditorProps) {
  const updateRule = useMockStore((s) => s.updateRule)
  const [draft, setDraft] = useState<MockRule>({ ...rule })

  const handleSave = () => {
    updateRule(draft.id, draft)
    onClose()
  }

  const updateMatch = (updates: Partial<MockRule['match']>) => {
    setDraft({ ...draft, match: { ...draft.match, ...updates } })
  }

  const updateResponse = (updates: Partial<MockRule['response']>) => {
    setDraft({ ...draft, response: { ...draft.response, ...updates } })
  }

  const toggleMethod = (method: HttpMethod) => {
    const current = draft.match.methods ?? []
    const next = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method]
    updateMatch({ methods: next.length > 0 ? next : undefined })
  }

  return (
    <div className="flex h-full flex-col border-l">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-medium">Edit Mock</h3>
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
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-xs">Rule Name</Label>
            <Input
              className="h-8 text-xs"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="My mock rule"
            />
          </div>

          <Separator />

          {/* Match Condition */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium">Match Condition</h4>

            <div className="space-y-2">
              <Label className="text-xs">Operator</Label>
              <Select
                value={draft.match.operator}
                onValueChange={(v) => updateMatch({ operator: v as MatchOperator })}
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
              <Label className="text-xs">URL Pattern</Label>
              <Input
                className="h-8 text-xs font-mono"
                value={draft.match.value}
                onChange={(e) => updateMatch({ value: e.target.value })}
                placeholder="https://api.example.com/*"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Methods (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {HTTP_METHODS.map((method) => (
                  <label key={method} className="flex items-center gap-1.5">
                    <Checkbox
                      checked={draft.match.methods?.includes(method) ?? false}
                      onCheckedChange={() => toggleMethod(method)}
                    />
                    <span className="text-xs">{method}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Response Config */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium">Mock Response</h4>

            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <Label className="text-xs">Status Code</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  value={draft.response.statusCode}
                  onChange={(e) => updateResponse({ statusCode: parseInt(e.target.value, 10) || 200 })}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label className="text-xs">Delay (ms)</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  value={draft.response.delayMs}
                  onChange={(e) => updateResponse({ delayMs: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Body Type</Label>
              <Select
                value={draft.response.bodyType}
                onValueChange={(v) => updateResponse({ bodyType: v as MockBodyType })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_BODY_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Response Body</Label>
              <CodeEditor
                value={draft.response.body}
                onChange={(v) => updateResponse({ body: v })}
                language={bodyTypeToLanguage[draft.response.bodyType]}
                height="200px"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Response Headers</Label>
              <KeyValueTable
                items={draft.response.headers}
                onChange={(headers: KeyValuePair[]) => updateResponse({ headers })}
                keyPlaceholder="Header"
                valuePlaceholder="Value"
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
