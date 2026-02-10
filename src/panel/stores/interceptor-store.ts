import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InterceptRule } from '@/shared/types/intercept-rule'

interface InterceptorState {
  rules: InterceptRule[]
  enabled: boolean
  editingRuleId: string | null
  addRule: (rule: InterceptRule) => void
  updateRule: (id: string, updates: Partial<InterceptRule>) => void
  removeRule: (id: string) => void
  toggleRule: (id: string) => void
  reorderRules: (rules: InterceptRule[]) => void
  setEnabled: (enabled: boolean) => void
  setEditingRuleId: (id: string | null) => void
}

export const useInterceptorStore = create<InterceptorState>()(
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
      reorderRules: (rules) => set({ rules }),
      setEnabled: (enabled) => set({ enabled }),
      setEditingRuleId: (id) => set({ editingRuleId: id }),
    }),
    { name: 'reqx-interceptor' },
  ),
)
