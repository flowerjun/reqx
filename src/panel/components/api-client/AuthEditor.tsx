import { useApiClientStore } from '../../stores/api-client-store'
import { useI18n } from '../../hooks/use-i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { AUTH_TYPES } from '@/shared/constants'
import type { AuthType } from '@/shared/constants'

export function AuthEditor() {
  const t = useI18n()
  const { authType, authConfig, setAuthType, setAuthConfig } = useApiClientStore()

  const authLabels: Record<AuthType, string> = {
    none: t.noAuth,
    bearer: t.bearerToken,
    basic: t.basicAuth,
    'api-key': t.apiKey,
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs">{t.authType}</Label>
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
          <Label className="text-xs">{t.token}</Label>
          <Input
            className="h-8 text-xs font-mono"
            type="password"
            placeholder={t.tokenPlaceholder}
            value={authConfig.bearerToken ?? ''}
            onChange={(e) => setAuthConfig({ ...authConfig, bearerToken: e.target.value })}
          />
        </div>
      )}

      {authType === 'basic' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">{t.username}</Label>
            <Input
              className="h-8 text-xs"
              placeholder={t.usernamePlaceholder}
              value={authConfig.basicUsername ?? ''}
              onChange={(e) => setAuthConfig({ ...authConfig, basicUsername: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t.password}</Label>
            <Input
              className="h-8 text-xs"
              type="password"
              placeholder={t.passwordPlaceholder}
              value={authConfig.basicPassword ?? ''}
              onChange={(e) => setAuthConfig({ ...authConfig, basicPassword: e.target.value })}
            />
          </div>
        </div>
      )}

      {authType === 'api-key' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">{t.headerName}</Label>
            <Input
              className="h-8 text-xs"
              placeholder={t.apiKeyHeaderPlaceholder}
              value={authConfig.apiKeyHeader ?? ''}
              onChange={(e) => setAuthConfig({ ...authConfig, apiKeyHeader: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{t.apiKey}</Label>
            <Input
              className="h-8 text-xs font-mono"
              type="password"
              placeholder={t.apiKeyPlaceholder}
              value={authConfig.apiKeyValue ?? ''}
              onChange={(e) => setAuthConfig({ ...authConfig, apiKeyValue: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
