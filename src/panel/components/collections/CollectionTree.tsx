import { useState, useRef, useEffect } from 'react'
import {
  ChevronRight, ChevronDown, Folder, FolderOpen, FileText,
  Trash2, MoreHorizontal, Copy, ArrowRightLeft, Pencil,
  ArrowUp, ArrowDown,
} from 'lucide-react'
import type { Collection, SavedRequest } from '@/shared/types/api-request'
import { useCollectionStore } from '../../stores/collection-store'
import { MoveRequestDialog } from './MoveRequestDialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { METHOD_COLORS } from '@/shared/constants'

interface CollectionTreeProps {
  collections: Collection[]
  onSelectRequest: (collectionId: string, request: SavedRequest) => void
  autoExpandIds?: Set<string>
}

export function CollectionTree({ collections, onSelectRequest, autoExpandIds }: CollectionTreeProps) {
  const {
    removeCollection, removeRequestFromCollection,
    updateCollection, updateRequestInCollection,
    duplicateRequest, reorderRequests,
  } = useCollectionStore()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const effectiveExpanded = autoExpandIds ?? expanded
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'collection' | 'request'
    collectionId: string
    requestId?: string
  } | null>(null)
  const [moveTarget, setMoveTarget] = useState<{
    collectionId: string
    requestId: string
    requestName: string
  } | null>(null)

  // Inline editing state
  const [editingCollection, setEditingCollection] = useState<string | null>(null)
  const [editingRequest, setEditingRequest] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingCollection, editingRequest])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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

  const startEditCollection = (collection: Collection) => {
    setEditingCollection(collection.id)
    setEditValue(collection.name)
  }

  const commitEditCollection = () => {
    if (editingCollection && editValue.trim()) {
      updateCollection(editingCollection, { name: editValue.trim() })
    }
    setEditingCollection(null)
  }

  const startEditRequest = (request: SavedRequest, collectionId: string) => {
    setEditingRequest(`${collectionId}:${request.id}`)
    setEditValue(request.name)
  }

  const commitEditRequest = () => {
    if (!editingRequest) return
    const [collectionId, requestId] = editingRequest.split(':')
    if (editValue.trim()) {
      updateRequestInCollection(collectionId, requestId, { name: editValue.trim() })
    }
    setEditingRequest(null)
  }

  const handleReorder = (collectionId: string, requestId: string, direction: 'up' | 'down') => {
    const collection = collections.find((c) => c.id === collectionId)
    if (!collection) return
    const ids = collection.requests.map((r) => r.id)
    const idx = ids.indexOf(requestId)
    if (idx === -1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= ids.length) return
    const newIds = [...ids]
    ;[newIds[idx], newIds[swapIdx]] = [newIds[swapIdx], newIds[idx]]
    reorderRequests(collectionId, newIds)
  }

  return (
    <>
      <div className="divide-y">
        {collections.map((collection) => {
          const isExpanded = effectiveExpanded.has(collection.id)

          return (
            <div key={collection.id}>
              {/* Collection header */}
              <div
                className="group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
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

                {editingCollection === collection.id ? (
                  <Input
                    ref={editInputRef}
                    className="h-6 text-xs flex-1"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key === 'Enter') commitEditCollection()
                      if (e.key === 'Escape') setEditingCollection(null)
                    }}
                    onBlur={commitEditCollection}
                  />
                ) : (
                  <span
                    className="text-xs font-medium flex-1 truncate"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      startEditCollection(collection)
                    }}
                  >
                    {collection.name}
                  </span>
                )}

                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {collection.requests.length}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditCollection(collection)
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-xs text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget({ type: 'collection', collectionId: collection.id })
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Requests */}
              {isExpanded && (
                <div className="pl-6">
                  {collection.requests.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground px-3 py-2">No saved requests</p>
                  ) : (
                    collection.requests.map((request, idx) => {
                      const editKey = `${collection.id}:${request.id}`
                      const isEditing = editingRequest === editKey

                      return (
                        <div
                          key={request.id}
                          className="group flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => onSelectRequest(collection.id, request)}
                        >
                          <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className={cn('text-[10px] font-mono font-bold shrink-0', METHOD_COLORS[request.method])}>
                            {request.method}
                          </span>

                          {isEditing ? (
                            <Input
                              ref={editInputRef}
                              className="h-5 text-xs flex-1"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                e.stopPropagation()
                                if (e.key === 'Enter') commitEditRequest()
                                if (e.key === 'Escape') setEditingRequest(null)
                              }}
                              onBlur={commitEditRequest}
                            />
                          ) : (
                            <span
                              className="text-xs truncate flex-1"
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                startEditRequest(request, collection.id)
                              }}
                            >
                              {request.name || request.url}
                            </span>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectRequest(collection.id, request)
                                }}
                              >
                                <FileText className="h-3 w-3 mr-2" />
                                Load
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditRequest(request, collection.id)
                                }}
                              >
                                <Pencil className="h-3 w-3 mr-2" />
                                Edit Name
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  duplicateRequest(collection.id, request.id)
                                }}
                              >
                                <Copy className="h-3 w-3 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setMoveTarget({
                                    collectionId: collection.id,
                                    requestId: request.id,
                                    requestName: request.name || request.url,
                                  })
                                }}
                              >
                                <ArrowRightLeft className="h-3 w-3 mr-2" />
                                Move to...
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-xs"
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReorder(collection.id, request.id, 'up')
                                }}
                              >
                                <ArrowUp className="h-3 w-3 mr-2" />
                                Move Up
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-xs"
                                disabled={idx === collection.requests.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReorder(collection.id, request.id, 'down')
                                }}
                              >
                                <ArrowDown className="h-3 w-3 mr-2" />
                                Move Down
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-xs text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteTarget({
                                    type: 'request',
                                    collectionId: collection.id,
                                    requestId: request.id,
                                  })
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    })
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

      {moveTarget && (
        <MoveRequestDialog
          open
          onOpenChange={() => setMoveTarget(null)}
          fromCollectionId={moveTarget.collectionId}
          requestId={moveTarget.requestId}
          requestName={moveTarget.requestName}
        />
      )}
    </>
  )
}
