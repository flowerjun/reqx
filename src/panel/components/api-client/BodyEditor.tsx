import { useApiClientStore } from '../../stores/api-client-store'
import { useI18n } from '../../hooks/use-i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { CodeEditor } from '../shared/CodeEditor'
import { BODY_TYPES } from '@/shared/constants'
import type { BodyType } from '@/shared/constants'
import type { EditorLanguage } from '@/lib/codemirror-setup'

const bodyTypeLang: Record<BodyType, EditorLanguage> = {
  none: 'text',
  json: 'json',
  'form-data': 'json',
  raw: 'text',
  binary: 'text',
}

export function BodyEditor() {
  const t = useI18n()
  const { bodyType, bodyContent, setBodyType, setBodyContent } = useApiClientStore()

  const bodyTypeLabels: Record<BodyType, string> = {
    none: t.none,
    json: t.json,
    'form-data': t.formData,
    raw: t.raw,
    binary: t.binary,
  }

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs">{t.bodyType}</Label>
        <Select value={bodyType} onValueChange={(v) => setBodyType(v as BodyType)}>
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BODY_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">
                {bodyTypeLabels[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {bodyType !== 'none' && (
        <CodeEditor
          value={bodyContent}
          onChange={setBodyContent}
          language={bodyTypeLang[bodyType] as EditorLanguage}
          height="200px"
          placeholder={bodyType === 'json' ? t.jsonPlaceholder : t.bodyPlaceholder}
        />
      )}
    </div>
  )
}
