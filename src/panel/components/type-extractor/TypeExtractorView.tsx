import { useState, useRef, useCallback, useEffect } from 'react'
import { Braces, GripVertical } from 'lucide-react'
import { jsonToTypeScript, type EmitMode } from '@/shared/json-to-typescript'
import { JsonInput } from './JsonInput'
import { TypeOutput } from './TypeOutput'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

const SAMPLE_JSON = `{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://cdn.example.com/avatar/1.png",
  "isActive": true,
  "roles": ["admin", "user", "admin"],
  "score": [95, "A+", true],
  "createdAt": "2024-01-15T09:30:00Z",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "zip": "62701"
  },
  "orders": [
    {
      "orderId": 1001,
      "total": 59.99,
      "status": "delivered",
      "items": [{ "sku": "A1", "qty": 2 }, { "sku": "B2", "qty": 1 }]
    },
    {
      "orderId": 1002,
      "total": 120.00,
      "status": "pending",
      "coupon": "SAVE10"
    }
  ],
  "metadata": null
}`

export function TypeExtractorView() {
  const [jsonInput, setJsonInput] = useState('')
  const [rootName, setRootName] = useState('Root')
  const [emitMode, setEmitMode] = useState<EmitMode>('type')
  const [splitPercent, setSplitPercent] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const { output, error } = (() => {
    if (!jsonInput.trim()) return { output: '', error: null }
    try {
      const parsed = JSON.parse(jsonInput)
      return { output: jsonToTypeScript(parsed, rootName || 'Root', emitMode), error: null }
    } catch (e) {
      return { output: '', error: 'Invalid JSON: ' + (e instanceof Error ? e.message : 'Parse error') }
    }
  })()

  const handleLoadSample = () => {
    setJsonInput(SAMPLE_JSON)
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = (x / rect.width) * 100
      setSplitPercent(Math.min(Math.max(percent, 20), 80))
    }

    const handleMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <Braces className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">JSON to TypeScript</span>
        </div>
        <div className="flex items-center gap-3">
          {/* type / interface toggle */}
          <div className="flex items-center rounded-md border p-0.5 bg-muted/50">
            <button
              onClick={() => setEmitMode('type')}
              className={`text-[10px] font-medium px-2.5 py-1 rounded transition-colors ${
                emitMode === 'type'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              type
            </button>
            <button
              onClick={() => setEmitMode('interface')}
              className={`text-[10px] font-medium px-2.5 py-1 rounded transition-colors ${
                emitMode === 'interface'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              interface
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Root name:</Label>
            <Input
              className="h-7 w-32 text-xs"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder="Root"
            />
          </div>
          <button
            onClick={handleLoadSample}
            className="text-[10px] text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Load sample
          </button>
        </div>
      </div>

      {/* Split panes */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: JSON input */}
        <div className="flex flex-col min-h-0 overflow-hidden" style={{ width: `${splitPercent}%` }}>
          <JsonInput value={jsonInput} onChange={setJsonInput} error={error} />
        </div>

        {/* Draggable divider */}
        <div
          onMouseDown={handleMouseDown}
          className="flex items-center justify-center w-2 shrink-0 border-x bg-muted/30 cursor-col-resize hover:bg-primary/10 active:bg-primary/20 transition-colors group"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </div>

        {/* Right: TypeScript output */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <TypeOutput value={output} />
        </div>
      </div>
    </div>
  )
}
