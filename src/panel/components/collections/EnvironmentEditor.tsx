import { useState } from 'react'
import { Plus, Trash2, Settings } from 'lucide-react'
import type { Environment, EnvironmentVariable } from '@/shared/types/api-request'
import { useCollectionStore } from '../../stores/collection-store'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import { ConfirmDialog } from '../shared/ConfirmDialog'

export function EnvironmentEditor() {
  const {
    environments,
    activeEnvironmentId,
    addEnvironment,
    updateEnvironment,
    removeEnvironment,
    setActiveEnvironment,
  } = useCollectionStore()

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId)

  const handleAddEnvironment = () => {
    const env: Environment = {
      id: crypto.randomUUID(),
      name: `Environment ${environments.length + 1}`,
      variables: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addEnvironment(env)
    setActiveEnvironment(env.id)
  }

  const handleAddVariable = () => {
    if (!activeEnv) return
    const updated: EnvironmentVariable[] = [
      ...activeEnv.variables,
      { key: '', value: '', enabled: true },
    ]
    updateEnvironment(activeEnv.id, { variables: updated })
  }

  const handleUpdateVariable = (index: number, field: keyof EnvironmentVariable, value: string | boolean) => {
    if (!activeEnv) return
    const updated = activeEnv.variables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v,
    )
    updateEnvironment(activeEnv.id, { variables: updated })
  }

  const handleRemoveVariable = (index: number) => {
    if (!activeEnv) return
    const updated = activeEnv.variables.filter((_, i) => i !== index)
    updateEnvironment(activeEnv.id, { variables: updated })
  }

  return (
    <>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label className="text-xs mb-1.5 block">Active Environment</Label>
            <Select
              value={activeEnvironmentId ?? 'none'}
              onValueChange={(v) => setActiveEnvironment(v === 'none' ? null : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="No environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">No environment</SelectItem>
                {environments.map((env) => (
                  <SelectItem key={env.id} value={env.id} className="text-xs">
                    {env.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-1">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleAddEnvironment}>
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
            {activeEnv && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={() => setDeleteId(activeEnv.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {activeEnv && (
          <>
            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">Environment Name</Label>
              <Input
                className="h-8 text-xs"
                value={activeEnv.name}
                onChange={(e) => updateEnvironment(activeEnv.id, { name: e.target.value })}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium">Variables</h4>
                <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={handleAddVariable}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {activeEnv.variables.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-4">
                      No variables defined. Use {'{{variableName}}'} in requests.
                    </p>
                  ) : (
                    activeEnv.variables.map((variable, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Checkbox
                          checked={variable.enabled}
                          onCheckedChange={(checked) =>
                            handleUpdateVariable(index, 'enabled', !!checked)
                          }
                        />
                        <Input
                          className="h-7 text-xs font-mono"
                          placeholder="key"
                          value={variable.key}
                          onChange={(e) => handleUpdateVariable(index, 'key', e.target.value)}
                        />
                        <Input
                          className="h-7 text-xs font-mono"
                          placeholder="value"
                          value={variable.value}
                          onChange={(e) => handleUpdateVariable(index, 'value', e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleRemoveVariable(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {!activeEnv && environments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Settings className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-xs text-muted-foreground">No environments yet.</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Create an environment to store variables for your requests.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Environment"
        description="Delete this environment and all its variables? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) removeEnvironment(deleteId)
        }}
      />
    </>
  )
}
