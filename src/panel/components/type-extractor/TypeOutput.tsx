import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { CodeEditor } from '../shared/CodeEditor'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { copyToClipboard } from '../../lib/clipboard'

interface TypeOutputProps {
  value: string
}

export function TypeOutput({ value }: TypeOutputProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!value) return
    await copyToClipboard(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <Label className="text-xs font-medium">TypeScript Output</Label>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px]"
          onClick={handleCopy}
          disabled={!value}
        >
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="flex-1 min-h-0">
        <CodeEditor
          value={value}
          language="javascript"
          readOnly
          height="100%"
          placeholder="TypeScript types will appear here..."
        />
      </div>
    </div>
  )
}
