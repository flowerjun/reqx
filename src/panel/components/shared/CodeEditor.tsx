import CodeMirror from '@uiw/react-codemirror'
import { useMemo, useState, useEffect } from 'react'
import { type EditorLanguage, getLanguageExtension, getDarkTheme } from '@/lib/codemirror-setup'
import { cn } from '@/lib/utils'

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: EditorLanguage
  readOnly?: boolean
  height?: string
  placeholder?: string
  className?: string
}

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'))
    })
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}

export function CodeEditor({
  value,
  onChange,
  language = 'json',
  readOnly = false,
  height = '200px',
  placeholder,
  className,
}: CodeEditorProps) {
  const extensions = useMemo(() => getLanguageExtension(language), [language])
  const isDark = useIsDarkMode()

  const allExtensions = useMemo(
    () => (isDark ? [...extensions, getDarkTheme()] : extensions),
    [extensions, isDark],
  )

  return (
    <div className={cn('h-full flex flex-col', className)}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={allExtensions}
        readOnly={readOnly}
        height={height}
        placeholder={placeholder}
        theme={isDark ? 'dark' : 'light'}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: !readOnly,
          bracketMatching: true,
          autocompletion: false,
        }}
        className="flex-1 min-h-0 overflow-hidden rounded-md border text-sm [&_.cm-editor]:!h-full [&_.cm-editor]:!bg-background [&_.cm-gutters]:!bg-muted/30"
      />
    </div>
  )
}
