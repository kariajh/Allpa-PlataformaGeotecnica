import { create } from 'zustand'

interface SyncState {
  isOnline: boolean
  pendingCount: number
  lastSyncAt: number | null
  syncing: boolean
  setOnline: (online: boolean) => void
  setPendingCount: (n: number) => void
  setSyncing: (syncing: boolean) => void
  markSynced: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: navigator.onLine,
  pendingCount: 0,
  lastSyncAt: null,
  syncing: false,
  setOnline: (online) => set({ isOnline: online }),
  setPendingCount: (n) => set({ pendingCount: n }),
  setSyncing: (syncing) => set({ syncing }),
  markSynced: () => set({ lastSyncAt: Date.now(), pendingCount: 0 }),
}))

window.addEventListener('online', () => useSyncStore.getState().setOnline(true))
window.addEventListener('offline', () => useSyncStore.getState().setOnline(false))
