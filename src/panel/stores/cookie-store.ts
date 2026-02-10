import { create } from 'zustand'
import type { BrowserCookie } from '@/shared/types/cookie'

interface CookieState {
  cookies: BrowserCookie[]
  selectedCookie: BrowserCookie | null
  filterDomain: string
  setCookies: (cookies: BrowserCookie[]) => void
  setSelectedCookie: (cookie: BrowserCookie | null) => void
  setFilterDomain: (domain: string) => void
}

export const useCookieStore = create<CookieState>()((set) => ({
  cookies: [],
  selectedCookie: null,
  filterDomain: '',
  setCookies: (cookies) => set({ cookies }),
  setSelectedCookie: (cookie) => set({ selectedCookie: cookie }),
  setFilterDomain: (domain) => set({ filterDomain: domain }),
}))
