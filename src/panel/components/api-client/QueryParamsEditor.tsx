import { useApiClientStore } from '../../stores/api-client-store'
import { KeyValueTable } from '../shared/KeyValueTable'

export function QueryParamsEditor() {
  const { queryParams, setQueryParams } = useApiClientStore()

  return (
    <div className="p-3">
      <KeyValueTable
        items={queryParams}
        onChange={setQueryParams}
        keyPlaceholder="Parameter"
        valuePlaceholder="Value"
      />
    </div>
  )
}
