import { json } from '@codemirror/lang-json'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { xml } from '@codemirror/lang-xml'
import { oneDark } from '@codemirror/theme-one-dark'
import type { Extension } from '@codemirror/state'

export type EditorLanguage = 'json' | 'javascript' | 'html' | 'xml' | 'text'

export function getLanguageExtension(lang: EditorLanguage): Extension[] {
  switch (lang) {
    case 'json':
      return [json()]
    case 'javascript':
      return [javascript({ typescript: true })]
    case 'html':
      return [html()]
    case 'xml':
      return [xml()]
    case 'text':
    default:
      return []
  }
}

export function getDarkTheme(): Extension {
  return oneDark
}
