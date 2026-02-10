import { useEffect, useRef, useEffectEvent } from 'react'

export function useRuleSync(
  rules: unknown[],
  enabled: boolean,
  syncRules: () => void,
  syncToggle?: () => void,
) {
  const onSyncRules = useEffectEvent(syncRules)
  const onSyncToggle = useEffectEvent(() => syncToggle?.())
  const isInitialMount = useRef(true)
  const hasSyncedInit = useRef(false)

  // Initial sync: re-send persisted state to service worker on panel open
  useEffect(() => {
    if (!hasSyncedInit.current && enabled) {
      hasSyncedInit.current = true
      onSyncToggle()
      onSyncRules()
    }
  }, [enabled])

  // Ongoing sync: send rules when they change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (enabled) {
      onSyncRules()
    }
  }, [rules, enabled])
}
