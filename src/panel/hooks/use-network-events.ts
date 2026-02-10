import type { BackgroundEvent } from '@/shared/types/messages'
import { useNetworkStore } from '../stores/network-store'

export function useNetworkEvents() {
  const addEntry = useNetworkStore((s) => s.addEntry)

  const handleEvent = (event: BackgroundEvent) => {
    if (event.type === 'NETWORK_REQUEST') {
      addEntry(event.entry)
    }
  }

  return handleEvent
}
