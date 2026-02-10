import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  pageOverlay: boolean
  setTheme: (theme: Theme) => void
  setPageOverlay: (enabled: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      pageOverlay: true,
      setTheme: (theme) => set({ theme }),
      setPageOverlay: (pageOverlay) => set({ pageOverlay }),
    }),
    { name: 'reqx-theme' },
  ),
)
