import { Plus, Trash2 } from 'lucide-react'
import type { KeyValuePair } from '@/shared/types/intercept-rule'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'

interface KeyValueTableProps {
  items: KeyValuePair[]
  onChange: (items: KeyValuePair[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export function KeyValueTable({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: KeyValueTableProps) {
  const addRow = () => {
    onChange([...items, { key: '', value: '', enabled: true }])
  }

  const updateRow = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    )
    onChange(updated)
  }

  const removeRow = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Checkbox
            checked={item.enabled}
            onCheckedChange={(checked) => updateRow(index, 'enabled', !!checked)}
          />
          <Input
            className="h-8 text-xs"
            placeholder={keyPlaceholder}
            value={item.key}
            onChange={(e) => updateRow(index, 'key', e.target.value)}
          />
          <Input
            className="h-8 text-xs"
            placeholder={valuePlaceholder}
            value={item.value}
            onChange={(e) => updateRow(index, 'value', e.target.value)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => removeRow(index)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addRow}>
        <Plus className="h-3 w-3 mr-1" />
        Add
      </Button>
    </div>
  )
}
