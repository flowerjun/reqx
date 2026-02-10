import { useState, useEffect, useEffectEvent } from 'react'
import { Plus, Cookie, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useCookieStore } from '../../stores/cookie-store'
import { useBackgroundPort } from '../../hooks/use-background-port'
import { CookieTable } from './CookieTable'
import { CookieEditor } from './CookieEditor'
import { EmptyState } from '../shared/EmptyState'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import type { BackgroundEvent } from '@/shared/types/messages'
import type { BrowserCookie, CookieSetParams } from '@/shared/types/cookie'

export function CookieView() {
  const { cookies, selectedCookie, filterDomain, setCookies, setSelectedCookie, setFilterDomain } = useCookieStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [clearConfirm, setClearConfirm] = useState(false)

  const handleEvent = (event: BackgroundEvent) => {
    if (event.type === 'COOKIES_LIST') {
      setCookies(event.cookies)
    }
  }

  const { sendCommand } = useBackgroundPort(handleEvent)

  const loadCookies = useEffectEvent((domain?: string) => {
    if (domain) {
      setFilterDomain(domain)
      sendCommand({ type: 'COOKIES_GET_ALL', domain })
    } else {
      sendCommand({ type: 'COOKIES_GET_ALL' })
    }
  })

  useEffect(() => {
    // Auto-detect current tab's domain and use as default filter
    if (chrome.devtools?.inspectedWindow) {
      chrome.devtools.inspectedWindow.eval(
        'window.location.hostname',
        (result: unknown) => {
          const hostname = typeof result === 'string' ? result : ''
          loadCookies(hostname || undefined)
        },
      )
    } else {
      loadCookies()
    }
  }, [])

  const handleRefresh = () => {
    sendCommand({ type: 'COOKIES_GET_ALL', domain: filterDomain || undefined })
  }

  const handleFilterDomain = (domain: string) => {
    setFilterDomain(domain)
    if (domain) {
      sendCommand({ type: 'COOKIES_GET_ALL', domain })
    } else {
      sendCommand({ type: 'COOKIES_GET_ALL' })
    }
  }

  const handleDeleteCookie = (cookie: BrowserCookie) => {
    const cleanDomain = cookie.domain.replace(/^\./, '')
    const url = `https://${cleanDomain}${cookie.path}`
    sendCommand({ type: 'COOKIE_REMOVE', params: { url, name: cookie.name } })
    if (
      selectedCookie?.name === cookie.name &&
      selectedCookie?.domain === cookie.domain
    ) {
      setSelectedCookie(null)
      setIsEditing(false)
    }
  }

  const handleSaveCookie = (params: CookieSetParams) => {
    sendCommand({ type: 'COOKIE_SET', params })
    setIsEditing(false)
    setIsCreating(false)
    setSelectedCookie(null)
  }

  const handleClearDomain = () => {
    if (filterDomain) {
      sendCommand({ type: 'COOKIES_CLEAR_DOMAIN', domain: filterDomain })
    }
    setClearConfirm(false)
  }

  const handleSelectCookie = (cookie: BrowserCookie) => {
    setSelectedCookie(cookie)
    setIsEditing(true)
    setIsCreating(false)
  }

  const handleCreate = () => {
    setSelectedCookie(null)
    setIsCreating(true)
    setIsEditing(true)
  }

  const filteredCookies = (() => {
    if (!searchQuery) return cookies
    const q = searchQuery.toLowerCase()
    return cookies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.value.toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q),
    )
  })()

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Cookie className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">Cookie Manager</span>
          <span className="text-[10px] text-muted-foreground">({cookies.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          {filterDomain && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-destructive"
              onClick={() => setClearConfirm(true)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Domain
            </Button>
          )}
          <Button size="sm" className="h-7 text-xs" onClick={handleCreate}>
            <Plus className="h-3 w-3 mr-1" />
            New Cookie
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            className="h-7 text-xs flex-1"
            placeholder="Search cookies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Input
          className="h-7 text-xs w-48"
          placeholder="Filter by domain..."
          value={filterDomain}
          onChange={(e) => handleFilterDomain(e.target.value)}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Cookie table */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {filteredCookies.length === 0 ? (
            <EmptyState
              icon={Cookie}
              title="No cookies found"
              description={
                filterDomain
                  ? `No cookies found for domain "${filterDomain}".`
                  : 'No browser cookies loaded. Click Refresh to fetch cookies.'
              }
              action={
                <Button size="sm" className="h-7 text-xs" onClick={handleRefresh}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              }
            />
          ) : (
            <CookieTable
              cookies={filteredCookies}
              selectedCookie={selectedCookie}
              onSelect={handleSelectCookie}
              onDelete={handleDeleteCookie}
            />
          )}
        </div>

        {/* Right: Cookie editor */}
        {isEditing && (
          <div className="w-80 shrink-0 overflow-hidden">
            <CookieEditor
              key={isCreating ? 'new' : `${selectedCookie?.domain}:${selectedCookie?.name}`}
              cookie={isCreating ? null : selectedCookie}
              onSave={handleSaveCookie}
              onClose={() => {
                setIsEditing(false)
                setIsCreating(false)
                setSelectedCookie(null)
              }}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={clearConfirm}
        onOpenChange={setClearConfirm}
        title="Clear Domain Cookies"
        description={`This will delete all cookies for "${filterDomain}". This action cannot be undone.`}
        confirmLabel="Clear All"
        variant="destructive"
        onConfirm={handleClearDomain}
      />
    </div>
  )
}
