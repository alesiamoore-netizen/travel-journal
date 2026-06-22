import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSyncStore = create(
  persist(
    (set) => ({
      lastSynced: null,
      lastSyncedBy: null,   // 'backup' | 'restore'
      setLastSynced: (ts, by) => set({ lastSynced: ts, lastSyncedBy: by }),
    }),
    { name: 'tj-sync' }
  )
)
