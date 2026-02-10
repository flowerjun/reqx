import { create } from 'zustand'
import type { NetworkEntry } from '@/shared/types/network-entry'

interface NetworkState {
  entries: NetworkEntry[]
  selectedEntryId: string | null
  addEntry: (entry: NetworkEntry) => void
  clearEntries: () => void
  selectEntry: (id: string | null) => void
}

const MAX_ENTRIES = 1000

export const useNetworkStore = create<NetworkState>()((set) => ({
  entries: [],
  selectedEntryId: null,
  addEntry: (entry) =>
    set((state) => ({
      entries: [...state.entries, entry].slice(-MAX_ENTRIES),
    })),
  clearEntries: () => set({ entries: [], selectedEntryId: null }),
  selectEntry: (id) => set({ selectedEntryId: id }),
}))
