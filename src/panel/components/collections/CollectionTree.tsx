import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Trash2, Plus } from 'lucide-react'
import type { Collection, SavedRequest } from '@/shared/types/api-request'
import { useCollectionStore } from '../../stores/collection-store'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { cn } from '@/lib/utils'
import { METHOD_COLORS } from '@/shared/constants'

interface CollectionTreeProps {
  collections: Collection[]
  onSelectRequest: (collectionId: string, request: SavedRequest) => void
}

export function CollectionTree({ collections, onSelectRequest }: CollectionTreeProps) {
  const { removeCollection, removeRequestFromCollection } = useCollectionStore()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'collection' | 'request'; collectionId: string; requestId?: string } | null>(null)

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'collection') {
      removeCollection(deleteTarget.collectionId)
    } else if (deleteTarget.requestId) {
      removeRequestFromCollection(deleteTarget.collectionId, deleteTarget.requestId)
    }
  }

  return (
    <>
      <div className="divide-y">
        {collections.map((collection) => {
          const isExpanded = expanded.has(collection.id)

          return (
            <div key={collection.id}>
              {/* Collection header */}
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(collection.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs font-medium flex-1 truncate">{collection.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {collection.requests.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget({ type: 'collection', collectionId: collection.id })
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Requests */}
              {isExpanded && (
                <div className="pl-6">
                  {collection.requests.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground px-3 py-2">No saved requests</p>
                  ) : (
                    collection.requests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onSelectRequest(collection.id, request)}
                      >
                        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className={cn('text-[10px] font-mono font-bold shrink-0', METHOD_COLORS[request.method])}>
                          {request.method}
                        </span>
                        <span className="text-xs truncate flex-1">{request.name || request.url}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget({ type: 'request', collectionId: collection.id, requestId: request.id })
                          }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={deleteTarget?.type === 'collection' ? 'Delete Collection' : 'Delete Request'}
        description={
          deleteTarget?.type === 'collection'
            ? 'Delete this collection and all its saved requests? This action cannot be undone.'
            : 'Delete this saved request? This action cannot be undone.'
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
