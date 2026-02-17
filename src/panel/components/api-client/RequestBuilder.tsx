import { useState, useEffect, useCallback } from 'react'
import { Loader2, Send, Save } from 'lucide-react'
import { useApiClientStore } from '../../stores/api-client-store'
import { SaveToCollectionDialog } from './SaveToCollectionDialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { HTTP_METHODS, METHOD_COLORS } from '@/shared/constants'
import type { HttpMethod } from '@/shared/constants'
import { cn } from '@/lib/utils'

interface RequestBuilderProps {
  onSend: () => void
  onCancel: () => void
}

export function RequestBuilder({ onSend, onCancel }: RequestBuilderProps) {
  const { method, url, loading, withCredentials, setMethod, setUrl, setWithCredentials } = useApiClientStore()
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleKeyboardSave = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      if (url) setShowSaveDialog(true)
    }
  }, [url])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardSave)
    return () => document.removeEventListener('keydown', handleKeyboardSave)
  }, [handleKeyboardSave])

  return (
    <>
      <div className="flex items-center gap-2">
        <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
          <SelectTrigger className="h-9 w-28 text-xs font-mono font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HTTP_METHODS.map((m) => (
              <SelectItem key={m} value={m} className={cn('text-xs font-mono font-bold', METHOD_COLORS[m])}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="h-9 flex-1 font-mono text-xs"
          placeholder="https://api.example.com/endpoint"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading) onSend()
          }}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
              onClick={() => setShowSaveDialog(true)}
              disabled={!url}
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save to Collection</TooltipContent>
        </Tooltip>

        {loading ? (
          <Button variant="destructive" size="sm" className="h-9 px-4" onClick={onCancel}>
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            Cancel
          </Button>
        ) : (
          <Button size="sm" className="h-9 px-4" onClick={onSend} disabled={!url}>
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Checkbox
          id="with-credentials"
          checked={withCredentials}
          onCheckedChange={(checked) => setWithCredentials(!!checked)}
        />
        <Label htmlFor="with-credentials" className="text-[11px] text-muted-foreground cursor-pointer">
          Send cookies (credentials: include)
        </Label>
      </div>

      <SaveToCollectionDialog open={showSaveDialog} onOpenChange={setShowSaveDialog} />
    </>
  )
}
