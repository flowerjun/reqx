import type { InterceptRule } from '@/shared/types/intercept-rule'
import type { HttpMethod } from '@/shared/constants'
import { matchUrl } from '@/shared/url-matcher'

export function findMatchingRule(
  rules: InterceptRule[],
  url: string,
  method: HttpMethod,
): InterceptRule | undefined {
  return rules
    .filter((r) => r.enabled)
    .toSorted((a, b) => a.order - b.order)
    .find((rule) => {
      if (rule.match.methods?.length && !rule.match.methods.includes(method)) {
        return false
      }
      return matchUrl(url, rule.match.value, rule.match.operator)
    })
}
