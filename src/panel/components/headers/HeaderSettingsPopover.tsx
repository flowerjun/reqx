import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import type { HeaderOverrideRule } from '@/shared/types/header-override'
import { HTTP_METHODS, MATCH_OPERATORS } from '@/shared/constants'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { useI18n } from '../../hooks/use-i18n'

interface HeaderSettingsPopoverProps {
  rule: HeaderOverrideRule
  onUpdate: (id: string, updates: Partial<HeaderOverrideRule>) => void
  children: ReactNode
}

export function HeaderSettingsPopover({ rule, onUpdate, children }: HeaderSettingsPopoverProps) {
  const t = useI18n()
  const hasConfig =
    (rule.match.value && rule.match.value.trim() !== '') ||
    (rule.match.methods && rule.match.methods.length > 0)

  const handleReset = () => {
    onUpdate(rule.id, {
      match: { operator: 'contains', value: '', methods: undefined },
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end" side="bottom">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-xs font-medium">{t.filterSettings}</span>
          {hasConfig && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-muted-foreground"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {t.reset}
            </Button>
          )}
        </div>

        <div className="p-3 space-y-3">
          {/* URL Pattern */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">{t.urlPatternLabel}</Label>
            <div className="flex gap-1.5">
              <Select
                value={rule.match.operator}
                onValueChange={(v) =>
                  onUpdate(rule.id, {
                    match: { ...rule.match, operator: v as typeof rule.match.operator },
                  })
                }
              >
                <SelectTrigger className="h-7 w-24 text-[10px] shrink-0">
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
              <Input
                className="h-7 text-[10px] font-mono"
                value={rule.match.value}
                onChange={(e) =>
                  onUpdate(rule.id, {
                    match: { ...rule.match, value: e.target.value },
                  })
                }
                placeholder={t.urlPatternPlaceholder}
              />
            </div>
          </div>

          <Separator />

          {/* HTTP Methods */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">
              {t.methodsLabel}
            </Label>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {HTTP_METHODS.map((method) => (
                <label key={method} className="flex items-center gap-1 text-[10px] cursor-pointer">
                  <Checkbox
                    checked={rule.match.methods?.includes(method) ?? false}
                    onCheckedChange={(checked) => {
                      const current = rule.match.methods ?? []
                      const next = checked
                        ? [...current, method]
                        : current.filter((m) => m !== method)
                      onUpdate(rule.id, {
                        match: {
                          ...rule.match,
                          methods: next.length > 0 ? next : undefined,
                        },
                      })
                    }}
                  />
                  {method}
                </label>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
