import type { ApiResponsePayload } from '@/shared/types/messages'
import { StatusBadge } from '../shared/StatusBadge'
import { Badge } from '../ui/badge'

interface ResponseMetaProps {
  response: ApiResponsePayload
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ResponseMeta({ response }: ResponseMetaProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <StatusBadge statusCode={response.statusCode} />
      <Badge variant="outline" className="text-xs">
        {response.statusText}
      </Badge>
      <Badge variant="outline" className="text-xs">
        {response.duration}ms
      </Badge>
      <Badge variant="outline" className="text-xs">
        {formatBytes(response.size)}
      </Badge>
    </div>
  )
}
