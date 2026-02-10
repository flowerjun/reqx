import { Trash2, Lock, Globe } from 'lucide-react'
import type { BrowserCookie } from '@/shared/types/cookie'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '@/lib/utils'

interface CookieTableProps {
  cookies: BrowserCookie[]
  selectedCookie: BrowserCookie | null
  onSelect: (cookie: BrowserCookie) => void
  onDelete: (cookie: BrowserCookie) => void
}

export function CookieTable({ cookies, selectedCookie, onSelect, onDelete }: CookieTableProps) {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-background border-b">
          <tr className="text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Value</th>
            <th className="px-3 py-2 font-medium">Domain</th>
            <th className="px-3 py-2 font-medium">Path</th>
            <th className="px-3 py-2 font-medium">Flags</th>
            <th className="px-3 py-2 font-medium w-10" />
          </tr>
        </thead>
        <tbody>
          {cookies.map((cookie) => {
            const key = `${cookie.domain}:${cookie.name}:${cookie.path}`
            const isSelected =
              selectedCookie?.domain === cookie.domain &&
              selectedCookie?.name === cookie.name &&
              selectedCookie?.path === cookie.path
            return (
              <tr
                key={key}
                onClick={() => onSelect(cookie)}
                className={cn(
                  'border-b cursor-pointer transition-colors hover:bg-accent/50',
                  isSelected && 'bg-accent',
                )}
              >
                <td className="px-3 py-1.5 font-mono truncate max-w-[160px]">{cookie.name}</td>
                <td className="px-3 py-1.5 font-mono truncate max-w-[200px] text-muted-foreground">
                  {cookie.value || <span className="italic">(empty)</span>}
                </td>
                <td className="px-3 py-1.5 truncate max-w-[140px]">{cookie.domain}</td>
                <td className="px-3 py-1.5 font-mono">{cookie.path}</td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-1">
                    {cookie.secure && (
                      <Badge variant="outline" className="h-4 px-1 text-[9px]">
                        <Lock className="h-2.5 w-2.5 mr-0.5" />
                        Secure
                      </Badge>
                    )}
                    {cookie.httpOnly && (
                      <Badge variant="outline" className="h-4 px-1 text-[9px]">
                        <Globe className="h-2.5 w-2.5 mr-0.5" />
                        HttpOnly
                      </Badge>
                    )}
                    {cookie.session && (
                      <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                        Session
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-3 py-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(cookie)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
