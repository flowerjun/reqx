import { Plus, Settings2, Trash2, GripVertical } from 'lucide-react'
import { useHeaderOverrideStore } from '../../stores/header-override-store'
import { useBackgroundPort } from '../../hooks/use-background-port'
import { useRuleSync } from '../../hooks/use-rule-sync'
import { EmptyState } from '../shared/EmptyState'
import { HeaderSettingsPopover } from './HeaderSettingsPopover'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import type { HeaderOverrideRule } from '@/shared/types/header-override'
import { cn } from '@/lib/utils'
import { useI18n } from '../../hooks/use-i18n'

export function HeaderOverrideView() {
  const t = useI18n()
  const { rules, enabled, addRule, updateRule, removeRule, toggleRule, setEnabled } =
    useHeaderOverrideStore()
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

  const handleAddHeader = () => {
    const newRule: HeaderOverrideRule = {
      id: crypto.randomUUID(),
      name: '',
      enabled: true,
      match: { operator: 'contains', value: '' },
      modifications: [
        { target: 'request', operation: 'set', name: '', value: '', enabled: true },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addRule(newRule)
  }

  const handleUpdateHeader = (id: string, name: string, value: string) => {
    const rule = rules.find((r) => r.id === id)
    if (!rule) return
    updateRule(id, {
      name: name || rule.name,
      modifications: [{ ...rule.modifications[0], name, value }],
    })
  }

  const hasMatchConfig = (rule: HeaderOverrideRule) => {
    return (
      (rule.match.value && rule.match.value.trim() !== '') ||
      (rule.match.methods && rule.match.methods.length > 0)
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={handleToggle} className="scale-90" />
          <Label className="text-xs font-medium">{t.headersOnOff(enabled)}</Label>
          {enabled && rules.filter((r) => r.enabled).length > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              {rules.filter((r) => r.enabled).length} {t.active}
            </Badge>
          )}
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={handleAddHeader}>
          <Plus className="h-3 w-3 mr-1" />
          {t.addHeader}
        </Button>
      </div>

      {/* Header list */}
      <ScrollArea className="flex-1">
        {rules.length === 0 ? (
          <EmptyState
            icon={GripVertical}
            title={t.noHeadersConfigured}
            description={t.noHeadersDescription}
            action={
              <Button size="sm" className="h-7 text-xs" onClick={handleAddHeader}>
                <Plus className="h-3 w-3 mr-1" />
                {t.addHeader}
              </Button>
            }
          />
        ) : (
          <div className="p-2 space-y-1">
            {/* Column labels */}
            <div className="flex items-center gap-2 px-2 pb-1">
              <div className="w-5" />
              <span className="flex-1 text-[10px] text-muted-foreground font-medium">{t.headerName}</span>
              <span className="flex-1 text-[10px] text-muted-foreground font-medium">{t.value}</span>
              <div className="w-14" />
            </div>

            {rules.map((rule) => {
              const mod = rule.modifications[0]
              if (!mod) return null
              const hasConfig = hasMatchConfig(rule)

              return (
                <div
                  key={rule.id}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 group transition-colors',
                    'hover:bg-accent/50',
                    !rule.enabled && 'opacity-50',
                  )}
                >
                  {/* Enable/Disable checkbox */}
                  <Checkbox
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                    className="shrink-0"
                  />

                  {/* Header name */}
                  <Input
                    className="h-7 flex-1 text-xs font-mono"
                    placeholder="Header-Name"
                    value={mod.name}
                    onChange={(e) => handleUpdateHeader(rule.id, e.target.value, mod.value)}
                  />

                  {/* Header value */}
                  <Input
                    className="h-7 flex-1 text-xs font-mono"
                    placeholder="value"
                    value={mod.value}
                    onChange={(e) => handleUpdateHeader(rule.id, mod.name, e.target.value)}
                  />

                  {/* Settings popover */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <HeaderSettingsPopover rule={rule} onUpdate={updateRule}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-7 w-7 shrink-0',
                              hasConfig
                                ? 'text-blue-500 hover:text-blue-600'
                                : 'opacity-0 group-hover:opacity-100',
                            )}
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                        </HeaderSettingsPopover>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[10px]">
                      {hasConfig ? t.filterConfigured : t.addUrlMethodFilter}
                    </TooltipContent>
                  </Tooltip>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={() => removeRule(rule.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
