import { create } from 'zustand'
import { db } from '@/db/database'
import type { HistoryEntry } from '@/shared/types/api-request'

const MAX_HISTORY = 100

interface HistoryState {
  entries: HistoryEntry[]
  loaded: boolean
  loadHistory: () => Promise<void>
  addEntry: (entry: HistoryEntry) => Promise<void>
  removeEntry: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  entries: [],
  loaded: false,

  loadHistory: async () => {
    const entries = await db.history.orderBy('timestamp').reverse().toArray()
    set({ entries, loaded: true })
  },

  addEntry: async (entry) => {
    await db.history.put(entry)
    const count = await db.history.count()
    if (count > MAX_HISTORY) {
      const oldest = await db.history.orderBy('timestamp').limit(count - MAX_HISTORY).toArray()
      await db.history.bulkDelete(oldest.map((e) => e.id))
    }
    set((s) => {
      const next = [entry, ...s.entries]
      if (next.length > MAX_HISTORY) next.length = MAX_HISTORY
      return { entries: next }
    })
  },

  removeEntry: async (id) => {
    await db.history.delete(id)
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
  },

  clearHistory: async () => {
    await db.history.clear()
    set({ entries: [] })
  },
}))
