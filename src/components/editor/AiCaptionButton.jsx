import { useState } from 'react'
import { getAiKey, saveAiKey, generateImageCaption } from '../../utils/anthropic'

export default function AiCaptionButton({ imageUrl, context, onCaption, mobile }) {
  const [showKey, setShowKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    const key = getAiKey()
    if (!key) { setShowKey(true); return }
    setLoading(true)
    setError('')
    try {
      const caption = await generateImageCaption({ imageUrl, context, apiKey: key })
      onCaption(caption)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const saveKey = () => {
    if (!apiKey.trim()) return
    saveAiKey(apiKey)
    setShowKey(false)
    setApiKey('')
  }

  if (showKey) {
    return (
      <div className={`space-y-1.5 ${mobile ? '' : 'mt-1'}`}>
        <p className={`text-stone-400 ${mobile ? 'text-xs' : 'text-[10px]'}`}>Enter your Anthropic API key (stored only in your browser).</p>
        <div className="flex gap-1.5">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveKey()}
            placeholder="sk-ant-…"
            className={`flex-1 border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400 ${mobile ? 'px-3 py-2 text-sm rounded-xl' : 'px-2 py-1 text-xs'}`}
          />
          <button onClick={saveKey} disabled={!apiKey.trim()}
            className={`bg-amber-700 text-white font-medium rounded-md disabled:opacity-50 ${mobile ? 'px-4 py-2 text-sm rounded-xl' : 'px-2 py-1 text-xs'}`}>
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={mobile ? '' : 'mt-1'}>
      <button
        onClick={run}
        disabled={loading}
        className={`flex items-center gap-1 font-medium text-amber-700 hover:text-amber-900 disabled:opacity-50 transition-colors ${mobile ? 'text-xs py-1' : 'text-[10px]'}`}
      >
        <span>✦</span>
        <span>{loading ? 'Writing caption…' : 'AI Caption'}</span>
      </button>
      {error && <p className={`text-red-500 mt-0.5 ${mobile ? 'text-xs' : 'text-[10px]'}`}>{error}</p>}
    </div>
  )
}
