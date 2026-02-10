import { useState } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import { useCollectionStore } from '../../stores/collection-store'
import { CollectionTree } from './CollectionTree'
import { EnvironmentEditor } from './EnvironmentEditor'
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
import type { Collection, SavedRequest } from '@/shared/types/api-request'

export function CollectionsView() {
  const { collections, addCollection } = useCollectionStore()
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

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

  const handleSelectRequest = (_collectionId: string, _request: SavedRequest) => {
    // Future: load request into API client or show details
  }

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
      <Tabs defaultValue="collections" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2 w-fit">
          <TabsTrigger value="collections" className="text-xs">
            Collections ({collections.length})
          </TabsTrigger>
          <TabsTrigger value="environments" className="text-xs">
            Environments
          </TabsTrigger>
        </TabsList>

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
            <CollectionTree
              collections={collections}
              onSelectRequest={handleSelectRequest}
            />
          )}
        </TabsContent>

        <TabsContent value="environments" className="flex-1 overflow-auto mt-0">
          <EnvironmentEditor />
        </TabsContent>
      </Tabs>

      {/* New collection dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
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
