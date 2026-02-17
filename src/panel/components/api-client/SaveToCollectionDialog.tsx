import { useState, useMemo } from 'react'
import { Save, Plus, FolderOpen } from 'lucide-react'
import { useCollectionStore } from '../../stores/collection-store'
import { useApiClientStore } from '../../stores/api-client-store'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import type { Collection, SavedRequest } from '@/shared/types/api-request'

interface SaveToCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function extractNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname
    if (path && path !== '/') {
      const segments = path.split('/').filter(Boolean)
      return segments.join('/') || urlObj.hostname
    }
    return urlObj.hostname
  } catch {
    return url || 'Untitled Request'
  }
}

export function SaveToCollectionDialog({ open, onOpenChange }: SaveToCollectionDialogProps) {
  const { collections, addCollection, addRequestToCollection, updateRequestInCollection } = useCollectionStore()
  const store = useApiClientStore()

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [requestName, setRequestName] = useState('')
  const [newCollectionName, setNewCollectionName] = useState('')

  const isUpdate = store.loadedFromCollectionId && store.loadedFromRequestId
  const defaultName = useMemo(() => extractNameFromUrl(store.url), [store.url])

  const handleSave = () => {
    const name = requestName.trim() || defaultName

    if (isUpdate && store.loadedFromCollectionId && store.loadedFromRequestId) {
      updateRequestInCollection(store.loadedFromCollectionId, store.loadedFromRequestId, {
        name,
        method: store.method,
        url: store.url,
        queryParams: store.queryParams.filter((p) => p.key),
        headers: store.headers.filter((h) => h.key),
        bodyType: store.bodyType,
        bodyContent: store.bodyContent,
        authType: store.authType,
        authConfig: store.authConfig,
        preRequestScript: store.preRequestScript,
        postResponseScript: store.postResponseScript,
        withCredentials: store.withCredentials,
      })
      onOpenChange(false)
      return
    }

    let collectionId = selectedCollectionId
    if (selectedCollectionId === '__new__') {
      if (!newCollectionName.trim()) return
      const newCol: Collection = {
        id: crypto.randomUUID(),
        name: newCollectionName.trim(),
        description: '',
        requests: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      addCollection(newCol)
      collectionId = newCol.id
    }
    if (!collectionId || collectionId === '__new__') return

    const request: SavedRequest = {
      id: crypto.randomUUID(),
      collectionId,
      name,
      method: store.method,
      url: store.url,
      queryParams: store.queryParams.filter((p) => p.key),
      headers: store.headers.filter((h) => h.key),
      bodyType: store.bodyType,
      bodyContent: store.bodyContent,
      authType: store.authType,
      authConfig: store.authConfig,
      preRequestScript: store.preRequestScript,
      postResponseScript: store.postResponseScript,
      withCredentials: store.withCredentials,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    addRequestToCollection(collectionId, request)
    onOpenChange(false)
  }

  const isNewCollection = selectedCollectionId === '__new__'
  const canSave = isUpdate || (isNewCollection ? newCollectionName.trim() : selectedCollectionId)

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setRequestName('')
          setNewCollectionName('')
          setSelectedCollectionId(
            store.loadedFromCollectionId || (collections.length > 0 ? collections[0].id : '__new__'),
          )
        }
        onOpenChange(v)
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isUpdate ? 'Update Request' : 'Save to Collection'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Request Name</Label>
            <Input
              className="h-8 text-xs"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder={defaultName}
            />
          </div>

          {isUpdate ? (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                This will update the existing request in its collection.
              </p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => {
                  useApiClientStore.setState({
                    loadedFromCollectionId: null,
                    loadedFromRequestId: null,
                  })
                }}
              >
                Save as new instead
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Collection</Label>
              <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-3 w-3" />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__" className="text-xs">
                    <div className="flex items-center gap-2 text-primary">
                      <Plus className="h-3 w-3" />
                      New Collection
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {isNewCollection && (
                <Input
                  className="h-8 text-xs"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && canSave && handleSave()}
                />
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={!canSave}>
            <Save className="h-3 w-3 mr-1" />
            {isUpdate ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
