import { useState } from 'react'
import { GDRIVE_CLIENT_ID, getAccessToken, backupToDrive, restoreFromDrive } from '../utils/driveSync'
import { useSyncStore } from '../store/syncStore'

export default function SyncPanel({ onClose }) {
  const { lastSynced, lastSyncedBy, setLastSynced } = useSyncStore()
  const [status, setStatus] = useState(null)   // null | 'working' | 'done' | 'error'
  const [message, setMessage] = useState('')
  const notConfigured = !GDRIVE_CLIENT_ID

  const run = async (action) => {
    setStatus('working')
    setMessage('Connecting to Google Drive…')
    try {
      const token = await getAccessToken()
      setMessage(action === 'backup' ? 'Uploading backup…' : 'Downloading backup…')
      if (action === 'backup') {
        await backupToDrive(token)
        const ts = new Date().toISOString()
        setLastSynced(ts, 'backup')
        setStatus('done')
        setMessage('Backup saved to Google Drive!')
      } else {
        const modifiedTime = await restoreFromDrive(token)
        setLastSynced(modifiedTime ?? new Date().toISOString(), 'restore')
        setStatus('done')
        setMessage('Restore complete — reload the page to see your journals.')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Google Drive Sync</h2>
          <p className="text-xs text-stone-400 mt-0.5">Back up and restore your journals</p>
        </div>

        <div className="p-5 space-y-4">
          {notConfigured ? (
            <div className="space-y-3">
              <p className="text-sm text-stone-600">
                Add your OAuth Client ID to{' '}
                <code className="bg-stone-100 px-1 py-0.5 rounded text-xs">.env.local</code>:
              </p>
              <pre className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-[11px] text-stone-700 overflow-x-auto leading-relaxed">
{`VITE_GDRIVE_CLIENT_ID=
  your-id.apps.googleusercontent.com`}
              </pre>
              <p className="text-xs text-stone-400 leading-relaxed">
                Get a Client ID at <span className="text-amber-700 font-medium">console.cloud.google.com</span>{' '}
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
                <p className="text-sm text-stone-500 flex items-center gap-2">
                  <span className="inline-block animate-spin">↻</span> {message}
                </p>
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
                Photos are not included in the backup — only journal structure, pages, and layout elements.
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
