const overlayState = new Map<number, boolean>()

export function getOverlayEnabled(tabId: number): boolean {
  return overlayState.get(tabId) ?? true
}

export function setOverlayEnabled(tabId: number, enabled: boolean): void {
  overlayState.set(tabId, enabled)
}

export function cleanupOverlayState(tabId: number): void {
  overlayState.delete(tabId)
}
