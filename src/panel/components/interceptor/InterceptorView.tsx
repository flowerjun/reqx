import { Plus, Shield } from 'lucide-react'
import { useInterceptorStore } from '../../stores/interceptor-store'
import { useBackgroundPort } from '../../hooks/use-background-port'
import { useRuleSync } from '../../hooks/use-rule-sync'
import { useResizablePanel } from '../../hooks/use-resizable-panel'
import { RuleList } from './RuleList'
import { RuleEditor } from './RuleEditor'
import { NetworkMonitor } from './NetworkMonitor'
import { EmptyState } from '../shared/EmptyState'
import { ResizableDivider } from '../shared/ResizableDivider'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import type { InterceptRule } from '@/shared/types/intercept-rule'

export function InterceptorView() {
  const { rules, enabled, editingRuleId, addRule, setEnabled, setEditingRuleId } = useInterceptorStore()
  const { width: panelWidth, containerRef, handleMouseDown } = useResizablePanel(320, 280, 600)

  const { sendCommand } = useBackgroundPort()

  useRuleSync(
    rules,
    enabled,
    () => sendCommand({ type: 'INTERCEPTOR_RULES_SYNC', rules }),
    () => sendCommand({ type: 'INTERCEPTOR_TOGGLE', enabled: true }),
  )

  const handleToggle = (checked: boolean) => {
    setEnabled(checked)
    sendCommand({ type: 'INTERCEPTOR_TOGGLE', enabled: checked })
    if (checked) {
      sendCommand({ type: 'INTERCEPTOR_RULES_SYNC', rules })
    }
  }

  const handleAddRule = () => {
    const newRule: InterceptRule = {
      id: crypto.randomUUID(),
      name: `Rule ${rules.length + 1}`,
      enabled: true,
      order: rules.length,
      match: { operator: 'equals', value: '' },
      action: { type: 'block' },
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
            <Label className="text-xs font-medium">Interceptor {enabled ? 'On' : 'Off'}</Label>
          </div>
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={handleAddRule}>
          <Plus className="h-3 w-3 mr-1" />
          New Rule
        </Button>
      </div>

      {/* Main content */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left panel: Rules + Network */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Tabs defaultValue="rules" className="flex flex-1 min-h-0 flex-col">
            <TabsList className="mx-4 mt-2 w-fit">
              <TabsTrigger value="rules" className="text-xs">
                Rules ({rules.length})
              </TabsTrigger>
              <TabsTrigger value="network" className="text-xs">
                Network
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="flex-1 overflow-auto mt-0">
              {rules.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No intercept rules"
                  description="Create rules to block, delay, redirect, or modify HTTP requests."
                  action={
                    <Button size="sm" className="h-7 text-xs" onClick={handleAddRule}>
                      <Plus className="h-3 w-3 mr-1" />
                      Create Rule
                    </Button>
                  }
                />
              ) : (
                <RuleList
                  rules={rules}
                  selectedId={editingRuleId}
                  onSelect={(id) => setEditingRuleId(id)}
                  globalEnabled={enabled}
                />
              )}
            </TabsContent>

            <TabsContent value="network" className="flex-1 overflow-auto mt-0">
              <NetworkMonitor />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel: Rule editor */}
        {editingRule && (
          <>
            <ResizableDivider onMouseDown={handleMouseDown} />
            <div className="shrink-0 overflow-hidden" style={{ width: panelWidth }}>
              <RuleEditor
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
