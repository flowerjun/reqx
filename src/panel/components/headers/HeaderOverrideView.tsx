import { Plus, FileText } from 'lucide-react'
import { useHeaderOverrideStore } from '../../stores/header-override-store'
import { useBackgroundPort } from '../../hooks/use-background-port'
import { useRuleSync } from '../../hooks/use-rule-sync'
import { useResizablePanel } from '../../hooks/use-resizable-panel'
import { HeaderOverrideList } from './HeaderOverrideList'
import { HeaderOverrideEditor } from './HeaderOverrideEditor'
import { EmptyState } from '../shared/EmptyState'
import { ResizableDivider } from '../shared/ResizableDivider'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import type { HeaderOverrideRule } from '@/shared/types/header-override'

export function HeaderOverrideView() {
  const { rules, enabled, editingRuleId, addRule, setEnabled, setEditingRuleId } = useHeaderOverrideStore()
  const { width: panelWidth, containerRef, handleMouseDown } = useResizablePanel(384, 320, 640)
  const { sendCommand } = useBackgroundPort()

  useRuleSync(
    rules,
    enabled,
    () => sendCommand({ type: 'HEADER_OVERRIDES_SYNC', rules }),
    () => sendCommand({ type: 'HEADER_OVERRIDES_TOGGLE', enabled: true }),
  )

  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
    sendCommand({ type: 'HEADER_OVERRIDES_TOGGLE', enabled: checked })
    if (checked) {
      sendCommand({ type: 'HEADER_OVERRIDES_SYNC', rules })
    }
  }

  const handleAddRule = () => {
    const newRule: HeaderOverrideRule = {
      id: crypto.randomUUID(),
      name: `Override ${rules.length + 1}`,
      enabled: true,
      match: { operator: 'equals', value: '' },
      modifications: [
        { target: 'request', operation: 'set', name: '', value: '', enabled: true },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addRule(newRule)
    setEditingRuleId(newRule.id)
  }

  const editingRule = rules.find((r) => r.id === editingRuleId)

  const handleSyncAfterEdit = () => {
    setEditingRuleId(null)
    if (enabled) {
      sendCommand({ type: 'HEADER_OVERRIDES_SYNC', rules })
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={handleToggle} className="scale-90" />
            <Label className="text-xs font-medium">Headers {enabled ? 'On' : 'Off'}</Label>
          </div>
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={handleAddRule}>
          <Plus className="h-3 w-3 mr-1" />
          New Override
        </Button>
      </div>

      {/* Main content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left panel: Rule list */}
        <div className="flex flex-1 flex-col overflow-auto">
          {rules.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No header override rules"
              description="Create rules to set, remove, or append request and response headers for matching URLs."
              action={
                <Button size="sm" className="h-7 text-xs" onClick={handleAddRule}>
                  <Plus className="h-3 w-3 mr-1" />
                  Create Override
                </Button>
              }
            />
          ) : (
            <HeaderOverrideList
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
              <HeaderOverrideEditor
                key={editingRule.id}
                rule={editingRule}
                onClose={handleSyncAfterEdit}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
