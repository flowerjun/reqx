import { ArrowDown, AlertCircle } from 'lucide-react'
import { useApiClientStore } from '../../stores/api-client-store'
import { useHistoryStore } from '../../stores/history-store'
import { useBackgroundPort } from '../../hooks/use-background-port'
import { RequestBuilder } from './RequestBuilder'
import { QueryParamsEditor } from './QueryParamsEditor'
import { BodyEditor } from './BodyEditor'
import { AuthEditor } from './AuthEditor'
import { ScriptEditor } from './ScriptEditor'
import { ResponseViewer } from './ResponseViewer'
import { KeyValueTable } from '../shared/KeyValueTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Separator } from '../ui/separator'
import type { BackgroundEvent } from '@/shared/types/messages'
import type { HistoryEntry } from '@/shared/types/api-request'

export function ApiClientView() {
  const store = useApiClientStore()
  const addHistoryEntry = useHistoryStore((s) => s.addEntry)

  const handleEvent = (event: BackgroundEvent) => {
    if (event.type === 'API_RESPONSE' && event.requestId === store.activeRequestId) {
      store.setResponse(event.response)
      store.setLoading(false)
      store.setActiveRequestId(null)

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        method: store.method,
        url: store.url,
        headers: store.headers.filter((h) => h.key),
        queryParams: store.queryParams.filter((p) => p.key),
        bodyType: store.bodyType,
        bodyContent: store.bodyContent,
        authType: store.authType,
        authConfig: store.authConfig,
        withCredentials: store.withCredentials,
        statusCode: event.response.statusCode,
        duration: event.response.duration,
        timestamp: Date.now(),
      }
      addHistoryEntry(entry)
    }
    if (event.type === 'API_ERROR' && event.requestId === store.activeRequestId) {
      store.setError(event.error)
      store.setLoading(false)
      store.setActiveRequestId(null)

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        method: store.method,
        url: store.url,
        headers: store.headers.filter((h) => h.key),
        queryParams: store.queryParams.filter((p) => p.key),
        bodyType: store.bodyType,
        bodyContent: store.bodyContent,
        authType: store.authType,
        authConfig: store.authConfig,
        withCredentials: store.withCredentials,
        statusCode: null,
        duration: null,
        timestamp: Date.now(),
      }
      addHistoryEntry(entry)
    }
  }

  const { sendCommand } = useBackgroundPort(handleEvent)

  const handleSend = () => {
    const requestId = crypto.randomUUID()
    store.setActiveRequestId(requestId)
    store.setLoading(true)
    store.setResponse(null)
    store.setError(null)

    sendCommand({
      type: 'API_REQUEST_EXECUTE',
      requestId,
      request: {
        method: store.method,
        url: store.url,
        headers: store.headers,
        queryParams: store.queryParams,
        bodyType: store.bodyType,
        bodyContent: store.bodyContent,
        authType: store.authType,
        authConfig: store.authConfig,
        withCredentials: store.withCredentials,
      },
    })
  }

  const handleCancel = () => {
    if (store.activeRequestId) {
      sendCommand({ type: 'API_REQUEST_CANCEL', requestId: store.activeRequestId })
      store.setLoading(false)
      store.setActiveRequestId(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Request builder */}
      <div className="border-b px-4 py-3">
        <RequestBuilder onSend={handleSend} onCancel={handleCancel} />
      </div>

      {/* Request config tabs */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Tabs defaultValue="params" className="flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-2 w-fit">
            <TabsTrigger value="params" className="text-xs">
              Params
              {store.queryParams.filter((p) => p.enabled && p.key).length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-[10px] text-primary">
                  {store.queryParams.filter((p) => p.enabled && p.key).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="headers" className="text-xs">Headers</TabsTrigger>
            <TabsTrigger value="body" className="text-xs">Body</TabsTrigger>
            <TabsTrigger value="auth" className="text-xs">Auth</TabsTrigger>
            <TabsTrigger value="scripts" className="text-xs">Scripts</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto">
            <TabsContent value="params" className="mt-0">
              <QueryParamsEditor />
            </TabsContent>
            <TabsContent value="headers" className="mt-0 p-3">
              <KeyValueTable
                items={store.headers}
                onChange={store.setHeaders}
                keyPlaceholder="Header"
                valuePlaceholder="Value"
              />
            </TabsContent>
            <TabsContent value="body" className="mt-0">
              <BodyEditor />
            </TabsContent>
            <TabsContent value="auth" className="mt-0">
              <AuthEditor />
            </TabsContent>
            <TabsContent value="scripts" className="mt-0">
              <ScriptEditor />
            </TabsContent>
          </div>
        </Tabs>

        {/* Response section */}
        {(store.response || store.error) && (
          <>
            <Separator />
            <div className="flex-1 overflow-hidden min-h-[200px]">
              {store.error ? (
                <div className="flex items-center gap-2 p-4 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{store.error}</span>
                </div>
              ) : store.response ? (
                <ResponseViewer response={store.response} />
              ) : null}
            </div>
          </>
        )}

        {!store.response && !store.error && !store.loading && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <ArrowDown className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">Response will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
