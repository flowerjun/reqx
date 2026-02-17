import { ArrowRightLeft, FolderOpen } from 'lucide-react'
import { useState } from 'react'
import { useCollectionStore } from '../../stores/collection-store'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

interface MoveRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromCollectionId: string
  requestId: string
  requestName: string
}

export function MoveRequestDialog({
  open,
  onOpenChange,
  fromCollectionId,
  requestId,
  requestName,
}: MoveRequestDialogProps) {
  const { collections, moveRequest } = useCollectionStore()
  const [targetId, setTargetId] = useState('')

  const availableCollections = collections.filter((c) => c.id !== fromCollectionId)

  const handleMove = () => {
    if (!targetId) return
    moveRequest(fromCollectionId, targetId, requestId)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setTargetId(availableCollections[0]?.id ?? '')
        onOpenChange(v)
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Move Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Move <span className="font-medium text-foreground">{requestName}</span> to:
          </p>
          {availableCollections.length === 0 ? (
            <p className="text-xs text-muted-foreground">No other collections available. Create one first.</p>
          ) : (
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                {availableCollections.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-3 w-3" />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleMove}
            disabled={!targetId || availableCollections.length === 0}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
