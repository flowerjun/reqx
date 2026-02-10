import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Collection, Environment, SavedRequest } from '@/shared/types/api-request'

interface CollectionState {
  collections: Collection[]
  environments: Environment[]
  activeEnvironmentId: string | null
  addCollection: (collection: Collection) => void
  updateCollection: (id: string, updates: Partial<Collection>) => void
  removeCollection: (id: string) => void
  addRequestToCollection: (collectionId: string, request: SavedRequest) => void
  removeRequestFromCollection: (collectionId: string, requestId: string) => void
  addEnvironment: (env: Environment) => void
  updateEnvironment: (id: string, updates: Partial<Environment>) => void
  removeEnvironment: (id: string) => void
  setActiveEnvironment: (id: string | null) => void
  importCollections: (data: { collections: Collection[]; environments: Environment[] }) => void
  getActiveVariables: () => Record<string, string>
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      collections: [],
      environments: [],
      activeEnvironmentId: null,
      addCollection: (collection) =>
        set((s) => ({ collections: [...s.collections, collection] })),
      updateCollection: (id, updates) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c,
          ),
        })),
      removeCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),
      addRequestToCollection: (collectionId, request) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId
              ? { ...c, requests: [...c.requests, request], updatedAt: Date.now() }
              : c,
          ),
        })),
      removeRequestFromCollection: (collectionId, requestId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId
              ? { ...c, requests: c.requests.filter((r) => r.id !== requestId), updatedAt: Date.now() }
              : c,
          ),
        })),
      addEnvironment: (env) =>
        set((s) => ({ environments: [...s.environments, env] })),
      updateEnvironment: (id, updates) =>
        set((s) => ({
          environments: s.environments.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e,
          ),
        })),
      removeEnvironment: (id) =>
        set((s) => ({
          environments: s.environments.filter((e) => e.id !== id),
          activeEnvironmentId: s.activeEnvironmentId === id ? null : s.activeEnvironmentId,
        })),
      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),
      importCollections: (data) =>
        set((s) => ({
          collections: [...s.collections, ...data.collections],
          environments: [...s.environments, ...data.environments],
        })),
      getActiveVariables: () => {
        const state = get()
        const env = state.environments.find((e) => e.id === state.activeEnvironmentId)
        if (!env) return {}
        const vars: Record<string, string> = {}
        for (const v of env.variables) {
          if (v.enabled) vars[v.key] = v.value
        }
        return vars
      },
    }),
    { name: 'reqx-collections' },
  ),
)
