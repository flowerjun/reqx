import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { ApiResponsePayload } from '@/shared/types/messages'
import { ResponseMeta } from './ResponseMeta'
import { CodeEditor } from '../shared/CodeEditor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Label } from '../ui/label'
import type { EditorLanguage } from '@/lib/codemirror-setup'

interface ResponseViewerProps {
  response: ApiResponsePayload
}

function HeaderTable({ headers, label }: { headers: Record<string, string>; label: string }) {
  const entries = Object.entries(headers)
  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label} ({entries.length})
      </Label>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="py-1.5 pr-3 font-medium w-[200px]">Name</th>
            <th className="py-1.5 font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b border-border/50">
              <td className="py-1.5 pr-3 font-mono font-medium text-foreground align-top">
                {key}
              </td>
              <td className="py-1.5 font-mono text-muted-foreground break-all">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false)

  const formattedBody = (() => {
    try {
      const parsed = JSON.parse(response.body)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return response.body
    }
  })()

  const language: EditorLanguage = (() => {
    const ct = response.headers['content-type'] ?? ''
    if (ct.includes('json')) return 'json'
    if (ct.includes('html')) return 'html'
    if (ct.includes('xml')) return 'xml'
    if (ct.includes('javascript')) return 'javascript'
    return 'text'
  })()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedBody)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const totalHeaderCount =
    Object.keys(response.requestHeaders ?? {}).length +
    Object.keys(response.headers).length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <ResponseMeta response={response} />
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopy}>
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <Tabs defaultValue="body" className="flex flex-1 flex-col">
        <TabsList className="mx-3 mt-2 w-fit">
          <TabsTrigger value="body" className="text-xs">Body</TabsTrigger>
          <TabsTrigger value="headers" className="text-xs">
            Headers
            {totalHeaderCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">
                {totalHeaderCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="flex-1 overflow-hidden mt-0 px-3 pb-3">
          <CodeEditor
            value={formattedBody}
            language={language}
            readOnly
            height="100%"
          />
        </TabsContent>

        <TabsContent value="headers" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-3">
              <HeaderTable
                headers={response.requestHeaders ?? {}}
                label="Request Headers"
              />
              <HeaderTable
                headers={response.headers}
                label="Response Headers"
              />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
