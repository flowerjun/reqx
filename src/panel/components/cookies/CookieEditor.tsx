import { useState } from 'react'
import { Save, X } from 'lucide-react'
import type { BrowserCookie, CookieSetParams } from '@/shared/types/cookie'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'

interface CookieEditorProps {
  cookie: BrowserCookie | null
  onSave: (params: CookieSetParams) => void
  onClose: () => void
}

export function CookieEditor({ cookie, onSave, onClose }: CookieEditorProps) {
  const isNew = !cookie
  const [name, setName] = useState(cookie?.name ?? '')
  const [value, setValue] = useState(cookie?.value ?? '')
  const [domain, setDomain] = useState(cookie?.domain ?? '')
  const [path, setPath] = useState(cookie?.path ?? '/')
  const [secure, setSecure] = useState(cookie?.secure ?? false)
  const [httpOnly, setHttpOnly] = useState(cookie?.httpOnly ?? false)
  const [sameSite, setSameSite] = useState<'no_restriction' | 'lax' | 'strict'>(
    cookie?.sameSite === 'unspecified' ? 'lax' : (cookie?.sameSite ?? 'lax'),
  )
  const [expirationDate, setExpirationDate] = useState(
    cookie?.expirationDate ? new Date(cookie.expirationDate * 1000).toISOString().slice(0, 16) : '',
  )

  const handleSave = () => {
    const cleanDomain = domain.replace(/^\./, '')
    const url = `http${secure ? 's' : ''}://${cleanDomain}${path}`
    const params: CookieSetParams = {
      url,
      name,
      value,
      domain: domain || undefined,
      path: path || '/',
      secure,
      httpOnly,
      sameSite,
    }
    if (expirationDate) {
      params.expirationDate = Math.floor(new Date(expirationDate).getTime() / 1000)
    }
    onSave(params)
  }

  return (
    <div className="flex h-full flex-col border-l">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs font-medium">{isNew ? 'New Cookie' : 'Edit Cookie'}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={!name}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label className="text-xs">Name</Label>
            <Input className="h-8 text-xs" value={name} onChange={(e) => setName(e.target.value)} placeholder="cookie_name" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Value</Label>
            <Input className="h-8 text-xs font-mono" value={value} onChange={(e) => setValue(e.target.value)} placeholder="cookie_value" />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs">Domain</Label>
            <Input className="h-8 text-xs" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder=".example.com" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Path</Label>
            <Input className="h-8 text-xs" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Expiration</Label>
            <Input
              type="datetime-local"
              className="h-8 text-xs"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Leave empty for session cookie</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs">SameSite</Label>
            <Select value={sameSite} onValueChange={(v) => setSameSite(v as typeof sameSite)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_restriction" className="text-xs">None</SelectItem>
                <SelectItem value="lax" className="text-xs">Lax</SelectItem>
                <SelectItem value="strict" className="text-xs">Strict</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Secure</Label>
            <Switch checked={secure} onCheckedChange={setSecure} className="scale-90" />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">HttpOnly</Label>
            <Switch checked={httpOnly} onCheckedChange={setHttpOnly} className="scale-90" />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
