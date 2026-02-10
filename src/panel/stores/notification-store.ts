import { create } from 'zustand'

export interface RuleNotification {
  id: string
  type: 'intercepted' | 'mocked' | 'header-overridden'
  ruleName: string
  ruleDetail: string
  url: string
  timestamp: number
}

interface NotificationState {
  notifications: RuleNotification[]
  addNotification: (n: Omit<RuleNotification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  addNotification: (n) =>
    set((state) => {
      const notification: RuleNotification = {
        ...n,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      }
      // Keep max 5 notifications
      const updated = [...state.notifications, notification].slice(-5)
      return { notifications: updated }
    }),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
}))
