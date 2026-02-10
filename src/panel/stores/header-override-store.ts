import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { HeaderOverrideRule } from '@/shared/types/header-override'

interface HeaderOverrideState {
  rules: HeaderOverrideRule[]
  enabled: boolean
  editingRuleId: string | null
  addRule: (rule: HeaderOverrideRule) => void
  updateRule: (id: string, updates: Partial<HeaderOverrideRule>) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void
  setEnabled: (enabled: boolean) => void
  setEditingRuleId: (id: string | null) => void
}

export const useHeaderOverrideStore = create<HeaderOverrideState>()(
  persist(
    (set) => ({
      rules: [],
      enabled: false,
      editingRuleId: null,
      addRule: (rule) =>
        set((state) => ({ rules: [...state.rules, rule] })),
      updateRule: (id, updates) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: Date.now() } : r,
          ),
        })),
      removeRule: (id) =>
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
          editingRuleId: state.editingRuleId === id ? null : state.editingRuleId,
        })),
      toggleRule: (id) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled, updatedAt: Date.now() } : r,
          ),
        })),
      setEnabled: (enabled) => set({ enabled }),
      setEditingRuleId: (id) => set({ editingRuleId: id }),
    }),
    { name: 'reqx-header-overrides' },
  ),
)
