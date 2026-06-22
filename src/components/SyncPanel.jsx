import { useState } from 'react'
import { GDRIVE_CLIENT_ID, getAccessToken, backupToDrive, restoreFromDrive } from '../utils/driveSync'
import { useSyncStore } from '../store/syncStore'

export default function SyncPanel({ onClose }) {
  const { lastSynced, lastSyncedBy, setLastSynced } = useSyncStore()
  const [status, setStatus] = useState(null)   // null | 'working' | 'done' | 'error'
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const notConfigured = !GDRIVE_CLIENT_ID

  const run = async (action) => {
    setStatus('working')
    setMessage('Connecting to Google Drive…')
    setProgress({ current: 0, total: 0 })

    const onProgress = (msg, current, total) => {
      setMessage(msg)
      setProgress({ current, total })
    }

    try {
      const token = await getAccessToken()
      if (action === 'backup') {
        const exportedAt = await backupToDrive(token, onProgress)
        setLastSynced(exportedAt, 'backup')
        setStatus('done')
        setMessage('Backup complete — all journals and photos saved to Google Drive.')
      } else {
        const exportedAt = await restoreFromDrive(token, onProgress)
        setLastSynced(exportedAt ?? new Date().toISOString(), 'restore')
        setStatus('done')
        setMessage('Restore complete — reload the page to see your journals.')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  const showBar = status === 'working' && progress.total > 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Google Drive Sync</h2>
          <p className="text-xs text-stone-400 mt-0.5">Journals, pages, photos — everything</p>
        </div>

        <div className="p-5 space-y-4">
          {notConfigured ? (
            <div className="space-y-3">
              <p className="text-sm text-stone-600">
                Add your OAuth Client ID to{' '}
                <code className="bg-stone-100 px-1 py-0.5 rounded text-xs">.env.local</code>:
              </p>
              <pre className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-[11px] text-stone-700 overflow-x-auto leading-relaxed whitespace-pre-wrap">{`VITE_GDRIVE_CLIENT_ID=your-id.apps.googleusercontent.com`}</pre>
              <p className="text-xs text-stone-400 leading-relaxed">
                Get a Client ID at{' '}
                <span className="text-amber-700 font-medium">console.cloud.google.com</span>{' '}
                → APIs &amp; Services → Credentials → OAuth 2.0. Enable the Google Drive API
                and add <code className="bg-stone-100 px-1 rounded">http://localhost:5173</code> to
                authorized JavaScript origins.
              </p>
            </div>
          ) : (
            <>
              {lastSynced && (
                <p className="text-xs text-stone-400">
                  Last {lastSyncedBy === 'backup' ? 'backed up' : 'restored'}:{' '}
                  {new Date(lastSynced).toLocaleString()}
                </p>
              )}

              {status === 'working' && (
                <div className="space-y-2">
                  <p className="text-sm text-stone-500">{message}</p>
                  {showBar && (
                    <>
                      <div className="w-full bg-stone-100 rounded-full h-1.5">
                        <div
                          className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-stone-400 text-right">
                        {progress.current} / {progress.total}
                      </p>
                    </>
                  )}
                </div>
              )}
              {status === 'done' && (
                <p className="text-sm text-green-600 font-medium">{message}</p>
              )}
              {status === 'error' && (
                <p className="text-sm text-red-500">{message}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => run('backup')}
                  disabled={status === 'working'}
                  className="flex-1 py-2 text-sm font-medium bg-amber-700 hover:bg-amber-800 text-white rounded-lg disabled:opacity-40 transition-colors"
                >
                  ↑ Backup
                </button>
                <button
                  onClick={() => run('restore')}
                  disabled={status === 'working'}
                  className="flex-1 py-2 text-sm font-medium border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-colors"
                >
                  ↓ Restore
                </button>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed">
                Backup uploads photos individually — only new photos are uploaded on repeat backups.
                Large libraries may take a few minutes the first time.
              </p>
            </>
          )}
        </div>

        <div className="px-5 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
