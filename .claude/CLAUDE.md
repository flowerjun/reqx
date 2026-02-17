# ReqX - Project Guide

## Overview

ReqX is a Chrome Extension (Manifest V3) DevTools toolkit for API development.
Provides: Network Interceptor, API Client, Collections, History, Type Extractor, Environment Variables.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 + TypeScript |
| State | Zustand 5 |
| DB | Dexie (IndexedDB) |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix UI) |
| Icons | Lucide React |
| Editor | CodeMirror 6 |
| Build | Vite 6 |
| Package Manager | pnpm |

---

## Project Structure

```
reqx/
├── manifest.json                  # Chrome Extension manifest (MV3)
├── src/
│   ├── background/                # Service Worker (background scripts)
│   │   ├── service-worker.ts      # Message routing, port management
│   │   ├── api-client-executor.ts # API request execution (fetch + DNR cookies)
│   │   ├── dnr-manager.ts         # DeclarativeNetRequest rule management
│   │   └── interceptor-*.ts       # Network interception logic
│   ├── content/                   # Content script (page injection)
│   ├── devtools/                  # DevTools page entry
│   ├── panel/                     # DevTools panel (React SPA)
│   │   ├── components/            # UI components
│   │   │   ├── api-client/        # API Client tab
│   │   │   ├── collections/       # Collections, History, Environments
│   │   │   ├── interceptor/       # Network interceptor tab
│   │   │   ├── type-extractor/    # JSON-to-TypeScript tab
│   │   │   ├── shared/            # Reusable components
│   │   │   └── ui/                # shadcn/ui primitives
│   │   ├── stores/                # Zustand stores
│   │   └── hooks/                 # Custom React hooks
│   ├── shared/                    # Shared types, constants
│   │   ├── types/                 # TypeScript interfaces
│   │   └── constants.ts           # DB version, HTTP methods, etc.
│   ├── db/                        # Dexie database schema
│   └── lib/                       # Utilities (cn, etc.)
├── .github/workflows/             # CI/CD
│   ├── release.yml                # Manual versioned release
│   └── auto-release.yml           # Auto draft release on push to main
├── ReqX/                          # Build output (gitignored)
└── public/icons/                  # Extension icons
```

---

## Development

### Prerequisites

- Node.js 20+
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)

### Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Watch mode build (development)
pnpm build            # Production build (typecheck + vite build)
pnpm test             # Run tests (vitest)
pnpm lint             # Lint (ESLint)
```

### Load in Chrome

1. `pnpm build`
2. Chrome > `chrome://extensions` > Developer mode ON
3. "Load unpacked" > select `ReqX/` folder
4. Open DevTools on any page > "ReqX" tab appears

### Hot Reload (Development)

1. `pnpm dev` (watches for changes)
2. After code changes, go to `chrome://extensions` and click the refresh icon on ReqX
3. Close and reopen DevTools to see changes

---

## Build & Release

### Build Output

`pnpm build` outputs to `ReqX/` directory:

```
ReqX/
├── manifest.json
├── icons/
├── service-worker.js       # Background service worker
├── content-script.js       # Content script
├── devtools.js             # DevTools page
├── src/panel/index.html    # Panel entry
└── assets/                 # JS/CSS bundles
```

### Creating a Release Zip (Manual / Local)

```bash
pnpm build
zip -r reqx-v0.2.0.zip ReqX/
```

This zip can be uploaded to Chrome Web Store or distributed directly.

### GitHub Release (Manual via CLI)

```bash
# Build and zip
pnpm build
zip -r reqx-v0.2.0.zip ReqX/

# Create draft release on GitHub
gh release create v0.2.0 \
  --title "ReqX v0.2.0" \
  --draft \
  --generate-notes \
  reqx-v0.2.0.zip
```

### GitHub Release (Manual via Actions)

1. Go to GitHub > Actions > "Create Release" workflow
2. Click "Run workflow"
3. Enter version (e.g., `0.2.0`)
4. Workflow builds, zips, and creates a draft release with the zip attached

### GitHub Release (Automatic on Push to Main)

Every push to `main` branch automatically:
1. Builds the project
2. Creates `reqx-v{version}-{short-sha}.zip`
3. Creates a **draft release** on GitHub with the zip attached
4. Version is read from `package.json`

To publish: Go to GitHub Releases > find the draft > edit > click "Publish release"

---

## Architecture Notes

### Message Flow (Panel <-> Service Worker)

```
Panel (React) --port.postMessage()--> Service Worker --response--> Panel
     |                                       |
     |  BackgroundCommand                    |  BackgroundEvent
     |  (API_REQUEST_EXECUTE, etc.)          |  (API_RESPONSE, API_ERROR, etc.)
```

### Cookie Sending (withCredentials)

The `fetch()` API forbids setting the `Cookie` header directly (Fetch spec "forbidden request header").
Even in Chrome Extension service workers, this restriction applies.

Solution: `chrome.declarativeNetRequest` session rules inject the Cookie header at the
browser's network stack level, which operates below the Fetch API restriction.

Flow:
1. `chrome.cookies.getAll({ url })` reads all browser cookies for the target URL
2. `chrome.declarativeNetRequest.updateSessionRules()` adds a temporary rule to set the Cookie header
3. `fetch()` is called (Cookie header is injected by DNR at network level)
4. Session rule is removed in `finally` block

Session rules are separate from dynamic rules (used by the interceptor's `dnr-manager.ts`),
so they don't conflict. Cookie rule IDs use the 900000+ range.

### Database (Dexie / IndexedDB)

- DB name: `reqx-db`, version defined in `src/shared/constants.ts`
- Tables: `interceptRules`, `collections`, `environments`, `history`
- Stores use Dexie directly for persistence, Zustand for reactive state

### State Management

Each feature has its own Zustand store:
- `api-client-store.ts` - Current request state, response, loading
- `collection-store.ts` - Collections CRUD, request management
- `history-store.ts` - Request history (IndexedDB backed, max 100)
- `environment-store.ts` - Environment variables
- `intercept-store.ts` - Interceptor rules
- `ui-store.ts` - Active panel, UI state

---

## Chrome Extension Permissions

| Permission | Purpose |
|-----------|---------|
| `debugger` | Network interception via Chrome DevTools Protocol |
| `storage` | Extension settings persistence |
| `cookies` | Read browser cookies for withCredentials feature |
| `declarativeNetRequest` | Inject Cookie header, block/redirect rules |
| `declarativeNetRequestFeedback` | DNR rule matching feedback |
| `host_permissions: <all_urls>` | Access any URL for API requests and cookies |

---

## Conventions

- Components use shadcn/ui primitives from `src/panel/components/ui/`
- Icons: Lucide React only (no emoji)
- Styles: Tailwind utility classes, `cn()` for conditional classes
- State: Zustand with `getState()` for non-reactive access, hooks for reactive
- Types: Shared types in `src/shared/types/`, component-local interfaces inline
- Build output directory: `ReqX/` (not `dist/`)
