import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCollabStore } from '../../store/collabStore'
import { useEditorStore } from '../../store/editorStore'

export default function CollabPanel() {
  const { enabled, user, signIn, signOut, active } = useCollabStore()
  const { notebook, enableCollab, disableCollab, refreshFromCloud, _cloudChangesAvailable } = useEditorStore()
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')

  if (!enabled) return null

  const handleJoin = () => {
    const code = joinCode.trim()
    if (!code) return
    navigate(`/journal/${code}`)
    setJoinCode('')
  }

  const handleToggle = async () => {
    if (!user) { await signIn(); return }
    if (active) { disableCollab(); return }
    await enableCollab()
  }

  const shortId = notebook?.id?.slice(0, 8) ?? '—'

  return (
    <div className="p-4 border-b border-stone-100">
      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Co-authoring</p>

      {!user ? (
        <button
          onClick={signIn}
          className="w-full py-2 text-xs font-medium border border-stone-200 rounded-md text-stone-600 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
              : <div className="w-5 h-5 rounded-full bg-amber-200 flex-shrink-0" />
            }
            <span className="text-xs text-stone-600 truncate">{user.displayName ?? user.email}</span>
          </div>

          <button
            onClick={handleToggle}
            className={`w-full py-1.5 text-xs font-medium rounded-md border transition-colors ${
              active
                ? 'bg-amber-700 text-white border-amber-700'
                : 'border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {active ? '⚡ Live sync on' : 'Enable live sync'}
          </button>

          {active && (
            <>
              <div className="text-[10px] text-stone-400 bg-stone-50 rounded px-2 py-1.5 leading-relaxed space-y-1">
                <p>Share this ID with collaborators:</p>
                <div className="flex items-center gap-1">
                  <code className="font-mono text-stone-600 select-all text-[9px] flex-1 truncate">{notebook?.id}</code>
                  <button
                    onClick={() => navigator.clipboard?.writeText(notebook?.id ?? '')}
                    className="text-[9px] text-amber-700 hover:text-amber-900 flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
              {_cloudChangesAvailable && (
                <button
                  onClick={refreshFromCloud}
                  className="w-full py-1.5 text-xs font-medium rounded-md border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                >
                  ↓ Pull remote changes
                </button>
              )}
            </>
          )}

          <button
            onClick={signOut}
            className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors"
          >
            Sign out
          </button>

          <div className="pt-2 border-t border-stone-100">
            <p className="text-[10px] text-stone-400 mb-1.5">Open a shared journal</p>
            <div className="flex gap-1">
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Journal ID…"
                className="flex-1 border border-stone-200 rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                onClick={handleJoin}
                className="px-2 py-1 text-[10px] bg-stone-100 hover:bg-stone-200 rounded border border-stone-200 transition-colors"
              >
                Open
              </button>
            </div>
            <p className="text-[10px] text-stone-300 mt-1">Paste the full journal ID from the owner.</p>
          </div>
        </div>
      )}
    </div>
  )
}
