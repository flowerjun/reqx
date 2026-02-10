import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MockRule } from '@/shared/types/mock-rule'

interface MockState {
  rules: MockRule[]
  enabled: boolean
  editingRuleId: string | null
  addRule: (rule: MockRule) => void
  updateRule: (id: string, updates: Partial<MockRule>) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void
  setEnabled: (enabled: boolean) => void
  setEditingRuleId: (id: string | null) => void
}

export const useMockStore = create<MockState>()(
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
    { name: 'reqx-mock' },
  ),
)
