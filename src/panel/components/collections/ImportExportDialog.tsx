import { useState, useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { useCollectionStore } from '../../stores/collection-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { CodeEditor } from '../shared/CodeEditor'
import type { Collection, Environment } from '@/shared/types/api-request'

export function ImportExportDialog() {
  const { collections, environments, importCollections } = useCollectionStore()
  const [open, setOpen] = useState(false)
  const [importData, setImportData] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const exportData = JSON.stringify({ collections, environments }, null, 2)

  const handleExport = () => {
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reqx-collections-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    setImportError(null)
    try {
      const parsed = JSON.parse(importData)
      if (!parsed.collections || !Array.isArray(parsed.collections)) {
        setImportError('Invalid format: missing "collections" array.')
        return
      }
      if (!parsed.environments || !Array.isArray(parsed.environments)) {
        setImportError('Invalid format: missing "environments" array.')
        return
      }
      importCollections({
        collections: parsed.collections as Collection[],
        environments: parsed.environments as Environment[],
      })
      setImportData('')
      setOpen(false)
    } catch {
      setImportError('Invalid JSON. Please check the format.')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text === 'string') {
        setImportData(text)
        setImportError(null)
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Download className="h-3 w-3 mr-1" />
          Import / Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import / Export Collections</DialogTitle>
          <DialogDescription>
            Export your collections as JSON or import from a file.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export">
          <TabsList className="w-fit">
            <TabsTrigger value="export" className="text-xs">Export</TabsTrigger>
            <TabsTrigger value="import" className="text-xs">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-3">
            <CodeEditor value={exportData} language="json" readOnly height="300px" />
            <Button size="sm" className="h-8 text-xs" onClick={handleExport}>
              <Download className="h-3 w-3 mr-1" />
              Download JSON
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3 w-3 mr-1" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <CodeEditor
              value={importData}
              onChange={setImportData}
              language="json"
              height="250px"
              placeholder="Paste JSON here or upload a file..."
            />
            {importError && (
              <p className="text-xs text-destructive">{importError}</p>
            )}
            <DialogFooter>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleImport}
                disabled={!importData.trim()}
              >
                Import
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
