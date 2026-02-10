import type { InterceptRule } from '@/shared/types/intercept-rule'

let ruleIdCounter = 1

export async function syncDnrRules(rules: InterceptRule[]): Promise<void> {
  // Get existing dynamic rules
  const existing = await chrome.declarativeNetRequest.getDynamicRules()
  const removeIds = existing.map((r) => r.id)

  // Build new rules for block/redirect actions only (DNR handles these efficiently)
  const addRules: chrome.declarativeNetRequest.Rule[] = []

  for (const rule of rules) {
    if (!rule.enabled) continue
    if (rule.action.type !== 'block' && rule.action.type !== 'redirect') continue

    let dnrAction: chrome.declarativeNetRequest.RuleAction
    let dnrCondition: chrome.declarativeNetRequest.RuleCondition

    if (rule.action.type === 'block') {
      dnrAction = { type: chrome.declarativeNetRequest.RuleActionType.BLOCK }
      dnrCondition = buildCondition(rule)
    } else if (rule.action.preservePath) {
      // Use regex-based substitution to replace matched part only
      const escaped = rule.match.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      dnrCondition = { regexFilter: `^(.*?)${escaped}(.*)$` }
      if (rule.match.methods?.length) {
        dnrCondition.requestMethods = rule.match.methods.map(
          (m) => m.toLowerCase() as chrome.declarativeNetRequest.RequestMethod,
        )
      }
      dnrAction = {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: { regexSubstitution: `\\1${rule.action.redirectUrl}\\2` },
      }
    } else {
      dnrAction = {
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: { url: rule.action.redirectUrl },
      }
      dnrCondition = buildCondition(rule)
    }

    const dnrRule: chrome.declarativeNetRequest.Rule = {
      id: ruleIdCounter++,
      priority: 1,
      action: dnrAction,
      condition: dnrCondition,
    }
    addRules.push(dnrRule)
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules,
  })
}

function buildCondition(
  rule: InterceptRule,
): chrome.declarativeNetRequest.RuleCondition {
  const condition: chrome.declarativeNetRequest.RuleCondition = {}

  switch (rule.match.operator) {
    case 'contains':
      condition.urlFilter = `*${rule.match.value}*`
      break
    case 'equals':
      condition.urlFilter = rule.match.value
      break
    case 'regex':
      condition.regexFilter = rule.match.value
      break
    case 'wildcard':
      condition.urlFilter = rule.match.value
      break
  }

  if (rule.match.methods?.length) {
    condition.requestMethods = rule.match.methods.map(
      (m) => m.toLowerCase() as chrome.declarativeNetRequest.RequestMethod,
    )
  }

  return condition
}

export async function clearAllDnrRules(): Promise<void> {
  const existing = await chrome.declarativeNetRequest.getDynamicRules()
  const removeIds = existing.map((r) => r.id)
  if (removeIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds })
  }
}
