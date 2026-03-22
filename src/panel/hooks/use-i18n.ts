import { useThemeStore } from '../stores/theme-store'
import { getTranslations, type Translations } from '@/shared/i18n'

export function useI18n(): Translations {
  const language = useThemeStore((s) => s.language)
  return getTranslations(language)
}
