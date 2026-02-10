import { useEffect, useEffectEvent } from 'react'
import { useThemeStore } from '../stores/theme-store'

export function useTheme() {
  const { theme, setTheme } = useThemeStore()

  const applyTheme = useEffectEvent((resolved: 'light' | 'dark') => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
  })

  useEffect(() => {
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mq.matches ? 'dark' : 'light')

      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light')
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }

    applyTheme(theme)
  }, [theme])

  return { theme, setTheme }
}
