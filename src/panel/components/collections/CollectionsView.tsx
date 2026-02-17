import { useState, useMemo } from 'react'
import { Plus, FolderOpen, Search } from 'lucide-react'
import { useCollectionStore } from '../../stores/collection-store'
import { useApiClientStore } from '../../stores/api-client-store'
import { useUiStore } from '../../stores/ui-store'
import { CollectionTree } from './CollectionTree'
import { CollectionSearch } from './CollectionSearch'
import { EnvironmentEditor } from './EnvironmentEditor'
import { HistoryList } from './HistoryList'
import { ImportExportDialog } from './ImportExportDialog'
import { EmptyState } from '../shared/EmptyState'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Label } from '../ui/label'
import type { Collection, Environment, SavedRequest } from '@/shared/types/api-request'

export function CollectionsView() {
  const { collections, addCollection, environments, addEnvironment, setActiveEnvironment } = useCollectionStore()
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('collections')

  const handleCreateCollection = () => {
    if (!newName.trim()) return
    const collection: Collection = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      description: newDesc.trim(),
      requests: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addCollection(collection)
    setNewName('')
    setNewDesc('')
    setShowNewDialog(false)
  }

  const loadRequest = useApiClientStore((s) => s.loadRequest)
  const setActivePanel = useUiStore((s) => s.setActivePanel)

  const handleSelectRequest = (_collectionId: string, request: SavedRequest) => {
    loadRequest(request)
    setActivePanel('api-client')
  }

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections
    const q = searchQuery.toLowerCase()
    return collections
      .map((c) => {
        const collectionMatches = c.name.toLowerCase().includes(q)
        const matchingRequests = c.requests.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.url.toLowerCase().includes(q) ||
            r.method.toLowerCase().includes(q),
        )
        if (collectionMatches) return c
        if (matchingRequests.length > 0) return { ...c, requests: matchingRequests }
        return null
      })
      .filter((c): c is Collection => c !== null)
  }, [collections, searchQuery])

  const autoExpandIds = useMemo(() => {
    if (!searchQuery.trim()) return undefined
    return new Set(filteredCollections.map((c) => c.id))
  }, [filteredCollections, searchQuery])

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs font-medium">Collections</span>
        <div className="flex items-center gap-2">
          <ImportExportDialog />
          <Button size="sm" className="h-7 text-xs" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-3 w-3 mr-1" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between mx-4 mt-2">
          <TabsList className="w-fit">
            <TabsTrigger value="collections" className="text-xs">
              Collections ({collections.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              History
            </TabsTrigger>
            <TabsTrigger value="environments" className="text-xs">
              Environments
            </TabsTrigger>
          </TabsList>
          {activeTab === 'environments' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const env: Environment = {
                  id: crypto.randomUUID(),
                  name: `Environment ${environments.length + 1}`,
                  variables: [],
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                }
                addEnvironment(env)
                setActiveEnvironment(env.id)
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          )}
        </div>

        <TabsContent value="collections" className="flex-1 overflow-auto mt-0">
          {collections.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="No collections"
              description="Create collections to organize and save your API requests."
              action={
                <Button size="sm" className="h-7 text-xs" onClick={() => setShowNewDialog(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Create Collection
                </Button>
              }
            />
          ) : (
            <>
              <CollectionSearch value={searchQuery} onChange={setSearchQuery} />
              {filteredCollections.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No results"
                  description={`No collections or requests matching "${searchQuery}".`}
                  className="py-8"
                />
              ) : (
                <CollectionTree
                  collections={filteredCollections}
                  onSelectRequest={handleSelectRequest}
                  autoExpandIds={autoExpandIds}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-auto mt-0">
          <HistoryList />
        </TabsContent>

        <TabsContent value="environments" className="flex-1 overflow-auto mt-0">
          <EnvironmentEditor />
        </TabsContent>
      </Tabs>

      {/* New collection dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input
                className="h-8 text-xs"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Collection"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                className="h-8 text-xs"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="A brief description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleCreateCollection} disabled={!newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
