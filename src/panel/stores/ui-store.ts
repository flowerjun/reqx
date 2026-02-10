import { create } from 'zustand'

export type PanelId = 'interceptor' | 'api-client' | 'mocking' | 'collections' | 'type-extractor' | 'cookies' | 'headers' | 'settings'

interface UiState {
  activePanel: PanelId
  sidebarCollapsed: boolean
  sidebarWidth: number
  sidebarResizing: boolean
  setActivePanel: (panel: PanelId) => void
  toggleSidebar: () => void
  setSidebarWidth: (width: number) => void
  setSidebarResizing: (resizing: boolean) => void
}

export const useUiStore = create<UiState>()((set) => ({
  activePanel: 'interceptor',
  sidebarCollapsed: false,
  sidebarWidth: 192,
  sidebarResizing: false,
  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  setSidebarResizing: (sidebarResizing) => set({ sidebarResizing }),
}))
