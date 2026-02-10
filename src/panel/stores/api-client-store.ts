import { create } from 'zustand'
import type { KeyValuePair } from '@/shared/types/intercept-rule'
import type { AuthConfig } from '@/shared/types/api-request'
import type { ApiResponsePayload } from '@/shared/types/messages'
import type { AuthType, BodyType, HttpMethod } from '@/shared/constants'

interface ApiClientState {
  method: HttpMethod
  url: string
  queryParams: KeyValuePair[]
  headers: KeyValuePair[]
  bodyType: BodyType
  bodyContent: string
  authType: AuthType
  authConfig: AuthConfig
  preRequestScript: string
  postResponseScript: string
  loading: boolean
  response: ApiResponsePayload | null
  error: string | null
  activeRequestId: string | null

  setMethod: (method: HttpMethod) => void
  setUrl: (url: string) => void
  setQueryParams: (params: KeyValuePair[]) => void
  setHeaders: (headers: KeyValuePair[]) => void
  setBodyType: (type: BodyType) => void
  setBodyContent: (content: string) => void
  setAuthType: (type: AuthType) => void
  setAuthConfig: (config: AuthConfig) => void
  setPreRequestScript: (script: string) => void
  setPostResponseScript: (script: string) => void
  setLoading: (loading: boolean) => void
  setResponse: (response: ApiResponsePayload | null) => void
  setError: (error: string | null) => void
  setActiveRequestId: (id: string | null) => void
  reset: () => void
}

const initialState = {
  method: 'GET' as HttpMethod,
  url: '',
  queryParams: [{ key: '', value: '', enabled: true }],
  headers: [{ key: '', value: '', enabled: true }],
  bodyType: 'none' as BodyType,
  bodyContent: '',
  authType: 'none' as AuthType,
  authConfig: {},
  preRequestScript: '',
  postResponseScript: '',
  loading: false,
  response: null,
  error: null,
  activeRequestId: null,
}

export const useApiClientStore = create<ApiClientState>()((set) => ({
  ...initialState,
  setMethod: (method) => set({ method }),
  setUrl: (url) => {
    try {
      const urlObj = new URL(url)
      if (urlObj.search) {
        const params: KeyValuePair[] = []
        urlObj.searchParams.forEach((value, key) => {
          params.push({ key, value, enabled: true })
        })
        params.push({ key: '', value: '', enabled: true })
        set({
          url: urlObj.origin + urlObj.pathname,
          queryParams: params,
        })
        return
      }
    } catch {
      // URL parsing fails during typing - just set the raw URL
    }
    set({ url })
  },
  setQueryParams: (queryParams) => set((state) => {
    const base = state.url.split('?')[0]
    return { queryParams, url: base }
  }),
  setHeaders: (headers) => set({ headers }),
  setBodyType: (bodyType) => set({ bodyType }),
  setBodyContent: (bodyContent) => set({ bodyContent }),
  setAuthType: (authType) => set({ authType }),
  setAuthConfig: (authConfig) => set({ authConfig }),
  setPreRequestScript: (preRequestScript) => set({ preRequestScript }),
  setPostResponseScript: (postResponseScript) => set({ postResponseScript }),
  setLoading: (loading) => set({ loading }),
  setResponse: (response) => set({ response }),
  setError: (error) => set({ error }),
  setActiveRequestId: (activeRequestId) => set({ activeRequestId }),
  reset: () => set(initialState),
}))
