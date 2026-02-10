/**
 * Copy text to clipboard with fallback for DevTools panels.
 *
 * DevTools panels block the Clipboard API due to permissions policy,
 * so we fall back to the legacy execCommand approach.
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}
