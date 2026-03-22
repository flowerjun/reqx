import type { InterceptRule, HeaderMod } from '@/shared/types/intercept-rule'
import type { MatchOperator } from '@/shared/constants'
import type { Translations } from '@/shared/i18n'
import { useI18n } from '../../hooks/use-i18n'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import { Plus, Trash2 } from 'lucide-react'

type ActionType = InterceptRule['action']['type']

function getActionTypes(t: Translations): { value: ActionType; label: string; description: string }[] {
  return [
    { value: 'block', label: t.blockRequest, description: t.blockRequestDesc },
    { value: 'delay', label: t.addDelay, description: t.addDelayDesc },
    { value: 'redirect', label: t.redirectLabel, description: t.redirectDesc },
    { value: 'modify-headers', label: t.modifyHeaders, description: t.modifyHeadersDesc },
  ]
}

interface RuleActionConfigProps {
  action: InterceptRule['action']
  matchOperator: MatchOperator
  onChange: (action: InterceptRule['action']) => void
}

function getDefaultsForType(type: ActionType): Partial<InterceptRule['action']> {
  switch (type) {
    case 'block':
      return { delayMs: undefined, redirectUrl: undefined, preservePath: undefined, requestHeaders: undefined, responseHeaders: undefined }
    case 'delay':
      return { delayMs: 1000, redirectUrl: undefined, preservePath: undefined }
    case 'redirect':
      return { redirectUrl: '', delayMs: undefined }
    case 'modify-headers':
      return { requestHeaders: [], responseHeaders: [], delayMs: undefined, redirectUrl: undefined, preservePath: undefined }
  }
}

export function RuleActionConfig({ action, matchOperator, onChange }: RuleActionConfigProps) {
  const t = useI18n()
  const ACTION_TYPES = getActionTypes(t)

  const handleTypeChange = (type: ActionType) => {
    onChange({ ...action, ...getDefaultsForType(type), type })
  }

  // Determine what additional actions are currently configured
  const hasDelay = (action.delayMs ?? 0) > 0
  const hasRedirect = !!action.redirectUrl || action.redirectUrl === ''
  const hasHeaders = action.requestHeaders !== undefined || action.responseHeaders !== undefined

  // Available extra actions (exclude the primary type)
  const canAddDelay = action.type !== 'delay' && action.type !== 'block' && !hasDelay
  const canAddRedirect = action.type !== 'redirect' && action.type !== 'block' && action.redirectUrl === undefined
  const canAddHeaders = action.type !== 'modify-headers' && action.type !== 'block' && !hasHeaders
  const canAddSomething = canAddDelay || canAddRedirect || canAddHeaders

  return (
    <div className="space-y-4">
      {/* Primary action type */}
      <div className="space-y-2">
        <Label className="text-xs">{t.actionType}</Label>
        <Select value={action.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((at) => (
              <SelectItem key={at.value} value={at.value} className="text-xs">
                {at.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Primary: Delay config */}
      {action.type === 'delay' && (
        <div className="space-y-2">
          <Label className="text-xs">{t.delayMs}</Label>
          <Input
            className="h-8 text-xs"
            type="number"
            min={0}
            step={100}
            value={action.delayMs ?? 1000}
            onChange={(e) => onChange({ ...action, delayMs: parseInt(e.target.value) || 0 })}
          />
        </div>
      )}

      {/* Primary: Redirect config */}
      {action.type === 'redirect' && (
        <RedirectConfig action={action} matchOperator={matchOperator} onChange={onChange} />
      )}

      {/* Primary: Modify headers config */}
      {action.type === 'modify-headers' && (
        <div className="space-y-4">
          <HeaderModList
            label={t.requestHeaders}
            headers={action.requestHeaders ?? []}
            onChange={(h) => onChange({ ...action, requestHeaders: h })}
          />
          <HeaderModList
            label={t.responseHeaders}
            headers={action.responseHeaders ?? []}
            onChange={(h) => onChange({ ...action, responseHeaders: h })}
          />
        </div>
      )}

      {/* Additional actions section */}
      {action.type !== 'block' && (
        <>
          {/* Show added extra actions */}
          {action.type !== 'delay' && hasDelay && (
            <>
              <Separator />
              <ExtraActionWrapper
                label={t.delay}
                onRemove={() => onChange({ ...action, delayMs: undefined })}
              >
                <Input
                  className="h-8 text-xs"
                  type="number"
                  min={0}
                  step={100}
                  value={action.delayMs ?? 1000}
                  onChange={(e) => onChange({ ...action, delayMs: parseInt(e.target.value) || 0 })}
                  placeholder={t.delayMsPlaceholder}
                />
              </ExtraActionWrapper>
            </>
          )}

          {action.type !== 'redirect' && hasRedirect && (
            <>
              <Separator />
              <ExtraActionWrapper
                label={t.redirect}
                onRemove={() => onChange({ ...action, redirectUrl: undefined, preservePath: undefined })}
              >
                <RedirectConfig action={action} matchOperator={matchOperator} onChange={onChange} />
              </ExtraActionWrapper>
            </>
          )}

          {action.type !== 'modify-headers' && hasHeaders && (
            <>
              <Separator />
              <ExtraActionWrapper
                label={t.modifyHeaders}
                onRemove={() => onChange({ ...action, requestHeaders: undefined, responseHeaders: undefined })}
              >
                <div className="space-y-4">
                  <HeaderModList
                    label={t.requestHeaders}
                    headers={action.requestHeaders ?? []}
                    onChange={(h) => onChange({ ...action, requestHeaders: h })}
                  />
                  <HeaderModList
                    label={t.responseHeaders}
                    headers={action.responseHeaders ?? []}
                    onChange={(h) => onChange({ ...action, responseHeaders: h })}
                  />
                </div>
              </ExtraActionWrapper>
            </>
          )}

          {/* Add Action button */}
          {canAddSomething && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  {t.addAction}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {canAddDelay && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onChange({ ...action, delayMs: 1000 })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t.delay}
                    </Button>
                  )}
                  {canAddRedirect && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onChange({ ...action, redirectUrl: '' })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t.redirect}
                    </Button>
                  )}
                  {canAddHeaders && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onChange({ ...action, requestHeaders: [], responseHeaders: [] })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t.modifyHeaders}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function ExtraActionWrapper({
  label,
  onRemove,
  children,
}: {
  label: string
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</Label>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </Button>
      </div>
      {children}
    </div>
  )
}

function RedirectConfig({
  action,
  matchOperator,
  onChange,
}: {
  action: InterceptRule['action']
  matchOperator: MatchOperator
  onChange: (action: InterceptRule['action']) => void
}) {
  const t = useI18n()

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">{t.redirectUrl}</Label>
        <Input
          className="h-8 text-xs font-mono"
          placeholder={t.redirectUrlPlaceholder}
          value={action.redirectUrl ?? ''}
          onChange={(e) => onChange({ ...action, redirectUrl: e.target.value })}
        />
      </div>
      {matchOperator !== 'equals' && (
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            {t.preservePath}
          </Label>
          <Switch
            checked={action.preservePath ?? false}
            onCheckedChange={(v) => onChange({ ...action, preservePath: v })}
          />
        </div>
      )}
    </div>
  )
}

function HeaderModList({
  label,
  headers,
  onChange,
}: {
  label: string
  headers: HeaderMod[]
  onChange: (headers: HeaderMod[]) => void
}) {
  const t = useI18n()

  const addHeader = () => {
    onChange([...headers, { operation: 'set', header: '', value: '' }])
  }

  const updateHeader = (index: number, updates: Partial<HeaderMod>) => {
    onChange(headers.map((h, i) => (i === index ? { ...h, ...updates } : h)))
  }

  const removeHeader = (index: number) => {
    onChange(headers.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {headers.map((h, index) => (
        <div key={index} className="flex items-center gap-2">
          <Select
            value={h.operation}
            onValueChange={(v) => updateHeader(index, { operation: v as 'set' | 'remove' })}
          >
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="set" className="text-xs">{t.set}</SelectItem>
              <SelectItem value="remove" className="text-xs">{t.remove}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="h-8 text-xs"
            placeholder={t.headerNamePlaceholder}
            value={h.header}
            onChange={(e) => updateHeader(index, { header: e.target.value })}
          />
          {h.operation === 'set' && (
            <Input
              className="h-8 text-xs"
              placeholder={t.valuePlaceholder}
              value={h.value}
              onChange={(e) => updateHeader(index, { value: e.target.value })}
            />
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeHeader(index)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addHeader}>
        <Plus className="h-3 w-3 mr-1" />
        {t.addHeader}
      </Button>
    </div>
  )
}
