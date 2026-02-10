import { Loader2, Send } from 'lucide-react'
import { useApiClientStore } from '../../stores/api-client-store'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { HTTP_METHODS, METHOD_COLORS } from '@/shared/constants'
import type { HttpMethod } from '@/shared/constants'
import { cn } from '@/lib/utils'

interface RequestBuilderProps {
  onSend: () => void
  onCancel: () => void
}

export function RequestBuilder({ onSend, onCancel }: RequestBuilderProps) {
  const { method, url, loading, setMethod, setUrl } = useApiClientStore()

  return (
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
  )
}
