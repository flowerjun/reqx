import { Badge } from '../ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  statusCode: number
  className?: string
}

function getStatusColor(code: number): string {
  if (code >= 200 && code < 300) return 'bg-green-500/15 text-green-600 border-green-500/20'
  if (code >= 300 && code < 400) return 'bg-blue-500/15 text-blue-600 border-blue-500/20'
  if (code >= 400 && code < 500) return 'bg-amber-500/15 text-amber-600 border-amber-500/20'
  if (code >= 500) return 'bg-red-500/15 text-red-600 border-red-500/20'
  return 'bg-muted text-muted-foreground'
}

export function StatusBadge({ statusCode, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(getStatusColor(statusCode), className)}>
      {statusCode}
    </Badge>
  )
}
