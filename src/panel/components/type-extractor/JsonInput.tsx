import { CodeEditor } from '../shared/CodeEditor'
import { Label } from '../ui/label'

interface JsonInputProps {
  value: string
  onChange: (value: string) => void
  error: string | null
}

export function JsonInput({ value, onChange, error }: JsonInputProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b shrink-0 min-h-10">
        <Label className="text-xs font-medium">JSON Input</Label>
        {error && <span className="text-[10px] text-destructive">{error}</span>}
      </div>
      <div className="flex-1 min-h-0">
        <CodeEditor
          value={value}
          onChange={onChange}
          language="json"
          height="100%"
          placeholder='Paste or type JSON here...\n\n{\n  "name": "John",\n  "age": 30\n}'
        />
      </div>
    </div>
  )
}
