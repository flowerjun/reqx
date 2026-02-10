import { useApiClientStore } from '../../stores/api-client-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { AUTH_TYPES } from '@/shared/constants'
import type { AuthType } from '@/shared/constants'

const authLabels: Record<AuthType, string> = {
  none: 'No Auth',
  bearer: 'Bearer Token',
  basic: 'Basic Auth',
  'api-key': 'API Key',
}

export function AuthEditor() {
  const { authType, authConfig, setAuthType, setAuthConfig } = useApiClientStore()

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Auth Type</Label>
        <Select value={authType} onValueChange={(v) => setAuthType(v as AuthType)}>
          <SelectTrigger className="h-7 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUTH_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="text-xs">
                {authLabels[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {authType === 'bearer' && (
        <div className="space-y-2">
          <Label className="text-xs">Token</Label>
          <Input
            className="h-8 text-xs font-mono"
            type="password"
            placeholder="Enter bearer token"
            value={authConfig.bearerToken ?? ''}
            onChange={(e) => setAuthConfig({ ...authConfig, bearerToken: e.target.value })}
          />
        </div>
      )}

      {authType === 'basic' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Username</Label>
            <Input
              className="h-8 text-xs"
              placeholder="Username"
              value={authConfig.basicUsername ?? ''}
              onChange={(e) => setAuthConfig({ ...authConfig, basicUsername: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Password</Label>
            <Input
              className="h-8 text-xs"
              type="password"
              placeholder="Password"
              value={authConfig.basicPassword ?? ''}
              onChange={(e) => setAuthConfig({ ...authConfig, basicPassword: e.target.value })}
            />
          </div>
        </div>
      )}

      {authType === 'api-key' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Header Name</Label>
            <Input
              className="h-8 text-xs"
              placeholder="X-API-Key"
              value={authConfig.apiKeyHeader ?? ''}
              onChange={(e) => setAuthConfig({ ...authConfig, apiKeyHeader: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">API Key</Label>
            <Input
              className="h-8 text-xs font-mono"
              type="password"
              placeholder="Enter API key"
              value={authConfig.apiKeyValue ?? ''}
              onChange={(e) => setAuthConfig({ ...authConfig, apiKeyValue: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
