import type { InterceptRule } from '@/shared/types/intercept-rule'
import { HTTP_METHODS, MATCH_OPERATORS } from '@/shared/constants'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'

interface RuleMatchConfigProps {
  match: InterceptRule['match']
  onChange: (match: InterceptRule['match']) => void
}

export function RuleMatchConfig({ match, onChange }: RuleMatchConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Match Operator</Label>
        <Select
          value={match.operator}
          onValueChange={(v) => onChange({ ...match, operator: v as typeof match.operator })}
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
          placeholder={match.operator === 'regex' ? '.*\\.api\\.com.*' : '*api.example.com*'}
          value={match.value}
          onChange={(e) => onChange({ ...match, value: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">HTTP Methods (empty = all)</Label>
        <div className="flex flex-wrap gap-3">
          {HTTP_METHODS.map((method) => (
            <label key={method} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <Checkbox
                checked={match.methods?.includes(method) ?? false}
                onCheckedChange={(checked) => {
                  const current = match.methods ?? []
                  const next = checked
                    ? [...current, method]
                    : current.filter((m) => m !== method)
                  onChange({ ...match, methods: next.length > 0 ? next : undefined })
                }}
              />
              {method}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
