import { Plus, Database } from 'lucide-react'
import { useMockStore } from '../../stores/mock-store'
import { useBackgroundPort } from '../../hooks/use-background-port'
import { useRuleSync } from '../../hooks/use-rule-sync'
import { useResizablePanel } from '../../hooks/use-resizable-panel'
import { MockRuleList } from './MockRuleList'
import { MockRuleEditor } from './MockRuleEditor'
import { EmptyState } from '../shared/EmptyState'
import { ResizableDivider } from '../shared/ResizableDivider'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import type { MockRule } from '@/shared/types/mock-rule'

export function MockView() {
  const { rules, enabled, editingRuleId, addRule, setEnabled, setEditingRuleId } = useMockStore()
  const { width: panelWidth, containerRef, handleMouseDown } = useResizablePanel(384, 320, 640)
  const { sendCommand } = useBackgroundPort()

  useRuleSync(
    rules,
    enabled,
    () => sendCommand({ type: 'MOCK_RULES_SYNC', rules }),
    () => sendCommand({ type: 'MOCK_TOGGLE', enabled: true }),
  )

  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
    sendCommand({ type: 'MOCK_TOGGLE', enabled: checked })
    if (checked) {
      sendCommand({ type: 'MOCK_RULES_SYNC', rules })
    }
  }

  const handleAddRule = () => {
    const newRule: MockRule = {
      id: crypto.randomUUID(),
      name: `Mock ${rules.length + 1}`,
      enabled: true,
      order: rules.length,
      match: { operator: 'equals', value: '' },
      response: {
        statusCode: 200,
        headers: [{ key: 'Content-Type', value: 'application/json', enabled: true }],
        body: '{\n  \n}',
        bodyType: 'json',
        delayMs: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addRule(newRule)
    setEditingRuleId(newRule.id)
  }

  const editingRule = rules.find((r) => r.id === editingRuleId)

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={handleToggle} className="scale-90" />
            <Label className="text-xs font-medium">Mocking {enabled ? 'On' : 'Off'}</Label>
          </div>
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={handleAddRule}>
          <Plus className="h-3 w-3 mr-1" />
          New Mock
        </Button>
      </div>

      {/* Main content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left panel: Rule list */}
        <div className="flex flex-1 flex-col overflow-auto">
          {rules.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No mock rules"
              description="Create rules to mock API responses with custom status codes, headers, and body."
              action={
                <Button size="sm" className="h-7 text-xs" onClick={handleAddRule}>
                  <Plus className="h-3 w-3 mr-1" />
                  Create Mock
                </Button>
              }
            />
          ) : (
            <MockRuleList
              rules={rules}
              selectedId={editingRuleId}
              onSelect={(id) => setEditingRuleId(id)}
              globalEnabled={enabled}
            />
          )}
        </div>

        {/* Right panel: Rule editor */}
        {editingRule && (
          <>
            <ResizableDivider onMouseDown={handleMouseDown} />
            <div className="shrink-0 overflow-hidden" style={{ width: panelWidth }}>
              <MockRuleEditor
                key={editingRule.id}
                rule={editingRule}
                onClose={() => setEditingRuleId(null)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
