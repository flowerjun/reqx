import type { MatchOperator } from './constants'

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function wildcardToRegex(pattern: string): string {
  return pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '(.*)')
    .replace(/\?/g, '(.)')
}

export function buildRedirectUrl(
  url: string,
  pattern: string,
  replacement: string,
  operator: MatchOperator,
): string {
  try {
    switch (operator) {
      case 'contains':
        return url.replace(new RegExp(escapeRegex(pattern), 'i'), replacement)
      case 'regex':
        return url.replace(new RegExp(pattern, 'i'), replacement)
      case 'wildcard':
        return url.replace(new RegExp(wildcardToRegex(pattern), 'i'), replacement)
      default:
        return replacement
    }
  } catch {
    return replacement
  }
}

export function matchUrl(
  url: string,
  pattern: string,
  operator: MatchOperator,
): boolean {
  if (!pattern || !pattern.trim()) return false

  switch (operator) {
    case 'contains':
      return url.toLowerCase().includes(pattern.toLowerCase())

    case 'equals':
      return url === pattern

    case 'regex': {
      try {
        const re = new RegExp(pattern, 'i')
        return re.test(url)
      } catch {
        return false
      }
    }

    case 'wildcard':
      return wildcardMatch(url, pattern)

    default:
      return false
  }
}

function wildcardMatch(str: string, pattern: string): boolean {
  const regex = wildcardToRegex(pattern)
  try {
    return new RegExp(`^${regex}$`, 'i').test(str)
  } catch {
    return false
  }
}
