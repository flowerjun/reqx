import { Search, X } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface CollectionSearchProps {
  value: string
  onChange: (value: string) => void
}

export function CollectionSearch({ value, onChange }: CollectionSearchProps) {
  return (
    <div className="relative px-3 py-2">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
      <Input
        className="h-7 pl-7 pr-7 text-xs"
        placeholder="Search collections..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5"
          onClick={() => onChange('')}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
