import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'

const KEY_STORAGE = 'travel_journal_ai_key'

function extractText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  return (node.content ?? []).map(extractText).join(' ')
}

export default function AiDraftModal({ onClose }) {
  const { notebook, pages, currentPageId, elements, updateElement, addElement } = useEditorStore()
  const currentPage = pages.find(p => p.id === currentPageId)

  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? '')
  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showKey, setShowKey] = useState(!localStorage.getItem(KEY_STORAGE))

  const saveKey = () => {
    localStorage.setItem(KEY_STORAGE, apiKey.trim())
    setShowKey(false)
  }

  const existingText = elements
    .filter(e => e.pageId === currentPageId && e.type === 'text' && e.data?.content)
    .map(e => extractText(e.data.content)).join(' ').trim().slice(0, 400)

  const generateDraft = async () => {
    const key = localStorage.getItem(KEY_STORAGE)
    if (!key) { setShowKey(true); return }
    setLoading(true)
    setError('')
    setDraft('')

    const context = [
      currentPage?.title && `Page title: ${currentPage.title}`,
      currentPage?.location && `Location: ${currentPage.location}`,
      currentPage?.date && `Date: ${currentPage.date}`,
      notebook?.name && `Journal: ${notebook.name}`,
      existingText && `Existing notes: "${existingText}"`,
      prompt && `My prompt: ${prompt}`,
    ].filter(Boolean).join('\n')

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `You are helping someone write a travel journal entry. Write a vivid, personal 2–3 paragraph journal entry in first person based on this context:\n\n${context}\n\nWrite naturally, as if the person is reflecting on their day. Focus on sensory details and emotions. Do not include headers or labels — just the journal text.`,
          }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message ?? 'API error')
      setDraft(data.content?.[0]?.text ?? '')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const insertDraft = async () => {
    if (!draft) return
    const textEl = elements.find(e => e.pageId === currentPageId && e.type === 'text')
    if (textEl) {
      const para = { type: 'paragraph', content: [{ type: 'text', text: draft }] }
      const existingContent = textEl.data.content?.content ?? []
      const newContent = { type: 'doc', content: [...existingContent, para] }
      updateElement(textEl.id, { data: { ...textEl.data, content: newContent } })
    } else {
      const el = await addElement('text')
      if (el) {
        const para = { type: 'paragraph', content: [{ type: 'text', text: draft }] }
        updateElement(el.id, { data: { ...el.data, content: { type: 'doc', content: [para] } } })
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className="text-amber-700">✦</span>
          <h2 className="text-base font-bold text-stone-900">AI Journal Draft</h2>
        </div>

        {showKey && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500">Enter your Anthropic API key. It's stored only in your browser.</p>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-…"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="flex gap-2">
              <button onClick={saveKey} disabled={!apiKey.trim()}
                className="flex-1 py-2 text-sm font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors">
                Save key
              </button>
              <button onClick={onClose}
                className="py-2 px-4 text-sm text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
                Cancel
              </button>
            </div>
            <p className="text-[10px] text-stone-400">Get your key at console.anthropic.com</p>
          </div>
        )}

        {!showKey && (
          <>
            <div className="text-xs text-stone-400 bg-stone-50 rounded-lg px-3 py-2 space-y-0.5">
              {currentPage?.title && <p>📖 {currentPage.title}</p>}
              {currentPage?.location && <p>📍 {currentPage.location}</p>}
              {currentPage?.date && <p>📅 {currentPage.date}</p>}
              {!currentPage?.title && !currentPage?.location && !currentPage?.date && (
                <p className="text-stone-300">Add a title, location, or date to the page for richer output.</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1.5">Optional prompt</label>
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. We had the best pasta…"
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            {draft && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">{draft}</p>
              </div>
            )}

            <div className="flex gap-2">
              {!draft ? (
                <button onClick={generateDraft} disabled={loading}
                  className="flex-1 py-2 text-sm font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors">
                  {loading ? 'Writing…' : 'Generate draft'}
                </button>
              ) : (
                <>
                  <button onClick={generateDraft} disabled={loading}
                    className="py-2 px-3 text-sm border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors text-stone-600">
                    {loading ? '…' : 'Regenerate'}
                  </button>
                  <button onClick={insertDraft}
                    className="flex-1 py-2 text-sm font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors">
                    Insert into page
                  </button>
                </>
              )}
              <button onClick={onClose}
                className="py-2 px-3 text-sm text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
                {draft ? 'Dismiss' : 'Cancel'}
              </button>
            </div>

            <button onClick={() => { setShowKey(true); setApiKey(localStorage.getItem(KEY_STORAGE) ?? '') }}
              className="text-[10px] text-stone-300 hover:text-stone-500 transition-colors w-full text-center">
              Change API key
            </button>
          </>
        )}
      </div>
    </div>
  )
}
