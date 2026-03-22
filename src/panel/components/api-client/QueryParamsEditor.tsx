import { useApiClientStore } from '../../stores/api-client-store'
import { useI18n } from '../../hooks/use-i18n'
import { KeyValueTable } from '../shared/KeyValueTable'

export function QueryParamsEditor() {
  const t = useI18n()
  const { queryParams, setQueryParams } = useApiClientStore()

  return (
    <div className="p-3">
      <KeyValueTable
        items={queryParams}
        onChange={setQueryParams}
        keyPlaceholder={t.parameterPlaceholder}
        valuePlaceholder={t.value}
      />
    </div>
  )
}
