import { useApiClientStore } from '../../stores/api-client-store'
import { CodeEditor } from '../shared/CodeEditor'
import { Label } from '../ui/label'

export function ScriptEditor() {
  const { preRequestScript, postResponseScript, setPreRequestScript, setPostResponseScript } =
    useApiClientStore()

  return (
    <div className="space-y-4 p-3">
      <div className="space-y-2">
        <Label className="text-xs">Pre-request Script</Label>
        <CodeEditor
          value={preRequestScript}
          onChange={setPreRequestScript}
          language="javascript"
          height="120px"
          placeholder="// Runs before the request is sent"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Post-response Script</Label>
        <CodeEditor
          value={postResponseScript}
          onChange={setPostResponseScript}
          language="javascript"
          height="120px"
          placeholder="// Runs after the response is received"
        />
      </div>
    </div>
  )
}
