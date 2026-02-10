import { GripVertical } from 'lucide-react'

interface ResizableDividerProps {
  onMouseDown: (e: React.MouseEvent) => void
}

export function ResizableDivider({ onMouseDown }: ResizableDividerProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="flex items-center justify-center w-1.5 shrink-0 cursor-col-resize
        hover:bg-primary/10 active:bg-primary/20 transition-colors group"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
    </div>
  )
}
