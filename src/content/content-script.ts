interface StatusMessage {
  source: 'reqx'
  type: 'STATUS_UPDATE'
  features: { intercept: boolean; mock: boolean; headers: boolean }
  overlay?: boolean
}

interface RuleMatchedMessage {
  source: 'reqx'
  type: 'RULE_MATCHED'
  matchType: 'intercepted' | 'mocked' | 'header-overridden'
  ruleName: string
  url: string
  action: string
}

interface OverlayToggleMessage {
  source: 'reqx'
  type: 'OVERLAY_TOGGLE'
  enabled: boolean
}

type ReqXMessage = StatusMessage | RuleMatchedMessage | OverlayToggleMessage

const TOAST_DURATION = 4000
const MAX_TOASTS = 5

let shadowRoot: ShadowRoot | null = null
let container: HTMLDivElement | null = null
let badgeBar: HTMLDivElement | null = null
let collapsedDotEl: HTMLDivElement | null = null
let collapseBtnEl: HTMLButtonElement | null = null
let toastContainer: HTMLDivElement | null = null
let interceptTag: HTMLSpanElement | null = null
let mockTag: HTMLSpanElement | null = null
let headersTag: HTMLSpanElement | null = null
let currentFeatures = { intercept: false, mock: false, headers: false }
let overlayEnabled = true
let badgeCollapsed = false

function getStyles(): string {
  return `
    :host {
      all: initial;
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: none;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .reqx-root {
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .badge-bar {
      display: none;
      align-items: center;
      gap: 0;
      padding: 0 4px 0 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1;
      backdrop-filter: blur(12px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      cursor: default;
      white-space: nowrap;
      height: 28px;
      transform: translateX(0);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }

    .badge-bar.visible {
      display: inline-flex;
      animation: slideIn 0.25s ease-out;
    }

    .badge-bar.slide-out {
      transform: translateX(calc(-100% - 24px));
      opacity: 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-right: 8px;
    }

    .brand-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite;
      flex-shrink: 0;
    }

    .brand-name {
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.5px;
    }

    .separator {
      width: 1px;
      height: 14px;
      opacity: 0.2;
      flex-shrink: 0;
    }

    .feature-tag {
      display: none;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      font-size: 10px;
      font-weight: 500;
      height: 100%;
    }

    .feature-tag.visible {
      display: inline-flex;
    }

    .tag-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;
      animation: pulse 2s infinite;
    }

    .tag-dot-intercept { background: #f97316; }
    .tag-dot-mock { background: #3b82f6; }
    .tag-dot-headers { background: #a855f7; }

    .collapse-btn {
      background: none;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      line-height: 1;
      opacity: 0.5;
      transition: opacity 0.15s, background 0.15s;
      color: currentColor;
      padding: 2px;
      margin-left: 2px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .collapse-btn:hover {
      opacity: 1;
      background: rgba(128,128,128,0.15);
    }
    .collapse-btn svg {
      width: 14px;
      height: 14px;
    }

    .collapsed-dot {
      display: none;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      backdrop-filter: blur(12px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      cursor: pointer;
      transform: translateX(0);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }

    .collapsed-dot:hover {
      transform: scale(1.15);
    }

    .collapsed-dot.visible {
      display: flex;
      animation: dotFadeIn 0.2s ease-out;
    }

    .collapsed-dot.slide-out {
      transform: translateX(calc(-100% - 24px));
      opacity: 0;
    }

    .collapsed-dot-inner {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      animation: pulse 2s infinite;
    }

    @media (prefers-color-scheme: dark) {
      .badge-bar {
        background: rgba(30, 30, 30, 0.9);
        border: 1px solid rgba(255,255,255,0.1);
        color: #e5e5e5;
      }
      .separator { background: #e5e5e5; }
      .collapsed-dot {
        background: rgba(30, 30, 30, 0.9);
        border: 1px solid rgba(255,255,255,0.1);
      }
      .toast {
        background: rgba(30, 30, 30, 0.95);
        border: 1px solid rgba(255,255,255,0.1);
        color: #e5e5e5;
      }
      .toast-url { color: #a3a3a3; }
      .toast-progress { background: rgba(255,255,255,0.15); }
    }

    @media (prefers-color-scheme: light) {
      .badge-bar {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0,0,0,0.1);
        color: #1a1a1a;
      }
      .separator { background: #1a1a1a; }
      .collapsed-dot {
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(0,0,0,0.1);
      }
      .toast {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0,0,0,0.08);
        color: #1a1a1a;
      }
      .toast-url { color: #737373; }
      .toast-progress { background: rgba(0,0,0,0.08); }
    }

    .toast-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
      max-width: 280px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      font-size: 11px;
      backdrop-filter: blur(12px);
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
      transform: translateX(0);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }

    .toast.slide-in {
      animation: slideIn 0.25s ease-out;
    }

    .toast.slide-out {
      transform: translateX(calc(-100% - 24px));
      opacity: 0;
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      border-radius: 0 0 8px 8px;
      transition: none;
    }

    .toast-progress.animate {
      transition: width linear;
    }

    .toast-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      margin-top: 4px;
      flex-shrink: 0;
    }

    .toast-dot-intercepted { background: #f97316; }
    .toast-dot-mocked { background: #3b82f6; }
    .toast-dot-header-overridden { background: #a855f7; }

    .toast-content { flex: 1; min-width: 0; }
    .toast-label { font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
    .toast-label-intercepted { color: #ea580c; }
    .toast-label-mocked { color: #2563eb; }
    .toast-label-header-overridden { color: #9333ea; }
    .toast-name { font-weight: 500; margin-left: 4px; }
    .toast-url {
      font-size: 10px;
      font-family: monospace;
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(calc(-100% - 24px)); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes dotFadeIn {
      from { opacity: 0; transform: scale(0.5); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `
}

function ensureOverlay(): void {
  if (shadowRoot) return

  const host = document.createElement('div')
  host.id = 'reqx-overlay-host'
  shadowRoot = host.attachShadow({ mode: 'closed' })

  const style = document.createElement('style')
  style.textContent = getStyles()
  shadowRoot.appendChild(style)

  container = document.createElement('div')
  container.className = 'reqx-root'
  shadowRoot.appendChild(container)

  // Single horizontal badge bar: [ReqX | Intercept | Mock | Headers  <]
  badgeBar = document.createElement('div')
  badgeBar.className = 'badge-bar'
  container.appendChild(badgeBar)

  // Brand section
  const brand = document.createElement('span')
  brand.className = 'brand'
  brand.innerHTML = '<span class="brand-dot"></span><span class="brand-name">ReqX</span>'
  badgeBar.appendChild(brand)

  // Separator after brand
  const sep1 = document.createElement('span')
  sep1.className = 'separator'
  badgeBar.appendChild(sep1)

  // Feature tags
  interceptTag = document.createElement('span')
  interceptTag.className = 'feature-tag'
  interceptTag.innerHTML = '<span class="tag-dot tag-dot-intercept"></span>Intercept'
  badgeBar.appendChild(interceptTag)

  mockTag = document.createElement('span')
  mockTag.className = 'feature-tag'
  mockTag.innerHTML = '<span class="tag-dot tag-dot-mock"></span>Mock'
  badgeBar.appendChild(mockTag)

  headersTag = document.createElement('span')
  headersTag.className = 'feature-tag'
  headersTag.innerHTML = '<span class="tag-dot tag-dot-headers"></span>Headers'
  badgeBar.appendChild(headersTag)

  // Collapse button (inline, always at end)
  const chevronLeft = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>'
  collapseBtnEl = document.createElement('button')
  collapseBtnEl.className = 'collapse-btn'
  collapseBtnEl.title = 'Collapse'
  collapseBtnEl.innerHTML = chevronLeft
  collapseBtnEl.addEventListener('click', collapseBadges)
  badgeBar.appendChild(collapseBtnEl)

  // Collapsed dot
  collapsedDotEl = document.createElement('div')
  collapsedDotEl.className = 'collapsed-dot'
  collapsedDotEl.innerHTML = '<span class="collapsed-dot-inner"></span>'
  collapsedDotEl.title = 'ReqX - Click to expand'
  collapsedDotEl.addEventListener('click', expandBadges)
  container.appendChild(collapsedDotEl)

  // Toast container
  toastContainer = document.createElement('div')
  toastContainer.className = 'toast-container'
  container.appendChild(toastContainer)

  document.documentElement.appendChild(host)
}

function collapseBadges(): void {
  badgeCollapsed = true
  if (badgeBar) {
    badgeBar.classList.add('slide-out')
  }
  setTimeout(() => {
    if (badgeBar) badgeBar.classList.remove('visible', 'slide-out')
    if (collapsedDotEl) collapsedDotEl.classList.add('visible')
  }, 300)
}

function expandBadges(): void {
  badgeCollapsed = false
  if (collapsedDotEl) collapsedDotEl.classList.remove('visible')
  updateBadges()
}

function updateBadges(): void {
  if (!overlayEnabled) {
    if (badgeBar) badgeBar.classList.remove('visible', 'slide-out')
    if (collapsedDotEl) collapsedDotEl.classList.remove('visible')
    return
  }

  const { intercept, mock, headers } = currentFeatures
  const anyActive = intercept || mock || headers

  if (!anyActive) {
    if (badgeBar) badgeBar.classList.remove('visible', 'slide-out')
    if (collapsedDotEl) collapsedDotEl.classList.remove('visible')
    badgeCollapsed = false
    return
  }

  if (badgeCollapsed) {
    if (badgeBar) badgeBar.classList.remove('visible', 'slide-out')
    if (collapsedDotEl) collapsedDotEl.classList.add('visible')
    return
  }

  // Show the bar
  if (badgeBar && !badgeBar.classList.contains('visible')) {
    badgeBar.classList.remove('slide-out')
    badgeBar.classList.add('visible')
  }
  if (collapsedDotEl) collapsedDotEl.classList.remove('visible')

  // Toggle individual feature tags
  toggleTag(interceptTag, intercept)
  toggleTag(mockTag, mock)
  toggleTag(headersTag, headers)
}

function toggleTag(tag: HTMLSpanElement | null, show: boolean): void {
  if (!tag) return
  if (show) {
    tag.classList.add('visible')
  } else {
    tag.classList.remove('visible')
  }
}

function addToast(matchType: string, ruleName: string, url: string): void {
  if (!toastContainer || !overlayEnabled) return

  const toast = document.createElement('div')
  toast.className = 'toast slide-in'

  let displayUrl: string
  try {
    const u = new URL(url)
    const path = u.pathname + u.search
    displayUrl = path.length > 50 ? path.slice(0, 47) + '...' : path
  } catch {
    displayUrl = url.length > 50 ? url.slice(0, 47) + '...' : url
  }

  const labelMap: Record<string, string> = {
    intercepted: 'Intercepted',
    mocked: 'Mocked',
    'header-overridden': 'Headers',
  }

  const progressColor: Record<string, string> = {
    intercepted: 'rgba(249,115,22,0.4)',
    mocked: 'rgba(59,130,246,0.4)',
    'header-overridden': 'rgba(168,85,247,0.4)',
  }

  toast.innerHTML = `
    <span class="toast-dot toast-dot-${matchType}"></span>
    <span class="toast-content">
      <span class="toast-label toast-label-${matchType}">${labelMap[matchType] ?? matchType}</span>
      <span class="toast-name">${escapeHtml(ruleName)}</span>
      <div class="toast-url">${escapeHtml(displayUrl)}</div>
    </span>
    <span class="toast-progress" style="width: 100%; background: ${progressColor[matchType] ?? 'rgba(255,255,255,0.15)'}"></span>
  `

  toastContainer.appendChild(toast)

  // Start toast progress bar
  const progressBar = toast.querySelector('.toast-progress') as HTMLElement
  if (progressBar) {
    requestAnimationFrame(() => {
      progressBar.classList.add('animate')
      progressBar.style.transitionDuration = `${TOAST_DURATION}ms`
      progressBar.style.width = '0%'
    })
  }

  // Trim to max
  while (toastContainer.children.length > MAX_TOASTS) {
    toastContainer.removeChild(toastContainer.children[0])
  }

  // Auto-remove after duration with slide-out
  setTimeout(() => {
    toast.classList.remove('slide-in')
    toast.classList.add('slide-out')
    setTimeout(() => toast.remove(), 300)
  }, TOAST_DURATION)
}

function escapeHtml(text: string): string {
  const el = document.createElement('span')
  el.textContent = text
  return el.innerHTML
}

function dismissOverlay(): void {
  // Animate badge bar out to the left
  if (badgeBar && badgeBar.classList.contains('visible')) {
    badgeBar.classList.add('slide-out')
    setTimeout(() => {
      badgeBar?.classList.remove('visible', 'slide-out')
    }, 300)
  }

  // Animate collapsed dot out to the left
  if (collapsedDotEl && collapsedDotEl.classList.contains('visible')) {
    collapsedDotEl.classList.add('slide-out')
    setTimeout(() => {
      collapsedDotEl?.classList.remove('visible', 'slide-out')
    }, 300)
  }

  // Animate all toasts out
  if (toastContainer) {
    const toasts = toastContainer.querySelectorAll('.toast')
    toasts.forEach((toast) => {
      (toast as HTMLElement).classList.remove('slide-in')
      ;(toast as HTMLElement).classList.add('slide-out')
    })
    setTimeout(() => {
      if (toastContainer) toastContainer.innerHTML = ''
    }, 300)
  }

  badgeCollapsed = false
}

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as ReqXMessage
  if (!msg || msg.source !== 'reqx') return

  if (msg.type === 'OVERLAY_TOGGLE') {
    overlayEnabled = msg.enabled
    if (!overlayEnabled) {
      dismissOverlay()
    } else {
      ensureOverlay()
      updateBadges()
    }
    return
  }

  ensureOverlay()

  if (msg.type === 'STATUS_UPDATE') {
    if (typeof msg.overlay === 'boolean') {
      overlayEnabled = msg.overlay
    }

    const prevAnyActive = currentFeatures.intercept || currentFeatures.mock || currentFeatures.headers
    currentFeatures = msg.features
    const newAnyActive = currentFeatures.intercept || currentFeatures.mock || currentFeatures.headers

    // Active → inactive: animate out (DevTools closed or all features disabled)
    if (prevAnyActive && !newAnyActive) {
      dismissOverlay()
    } else {
      updateBadges()
    }
  }

  if (msg.type === 'RULE_MATCHED') {
    addToast(msg.matchType, msg.ruleName, msg.url)
  }
})
