import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

export type Language = 'en' | 'ko'

interface ThemeState {
  theme: Theme
  pageOverlay: boolean
  language: Language
  setTheme: (theme: Theme) => void
  setPageOverlay: (enabled: boolean) => void
  setLanguage: (language: Language) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      pageOverlay: true,
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setPageOverlay: (pageOverlay) => set({ pageOverlay }),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'reqx-theme' },
  ),
)
