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
  updateRequestInCollection: (collectionId: string, requestId: string, updates: Partial<SavedRequest>) => void
  duplicateRequest: (collectionId: string, requestId: string) => void
  moveRequest: (fromCollectionId: string, toCollectionId: string, requestId: string) => void
  reorderRequests: (collectionId: string, requestIds: string[]) => void
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
      updateRequestInCollection: (collectionId, requestId, updates) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId
              ? {
                  ...c,
                  requests: c.requests.map((r) =>
                    r.id === requestId ? { ...r, ...updates, updatedAt: Date.now() } : r,
                  ),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        })),
      duplicateRequest: (collectionId, requestId) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c
            const original = c.requests.find((r) => r.id === requestId)
            if (!original) return c
            const copy: SavedRequest = {
              ...original,
              id: crypto.randomUUID(),
              name: `${original.name} (copy)`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }
            return { ...c, requests: [...c.requests, copy], updatedAt: Date.now() }
          }),
        })),
      moveRequest: (fromCollectionId, toCollectionId, requestId) =>
        set((s) => {
          const fromCol = s.collections.find((c) => c.id === fromCollectionId)
          const request = fromCol?.requests.find((r) => r.id === requestId)
          if (!request) return s
          const moved = { ...request, collectionId: toCollectionId, updatedAt: Date.now() }
          return {
            collections: s.collections.map((c) => {
              if (c.id === fromCollectionId) {
                return { ...c, requests: c.requests.filter((r) => r.id !== requestId), updatedAt: Date.now() }
              }
              if (c.id === toCollectionId) {
                return { ...c, requests: [...c.requests, moved], updatedAt: Date.now() }
              }
              return c
            }),
          }
        }),
      reorderRequests: (collectionId, requestIds) =>
        set((s) => ({
          collections: s.collections.map((c) => {
            if (c.id !== collectionId) return c
            const requestMap = new Map(c.requests.map((r) => [r.id, r]))
            const reordered = requestIds
              .map((id) => requestMap.get(id))
              .filter((r): r is SavedRequest => !!r)
            return { ...c, requests: reordered, updatedAt: Date.now() }
          }),
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
