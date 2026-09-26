import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { AI_KEY_STORAGE as KEY_STORAGE, callClaude, saveAiKey } from '../../utils/anthropic'

function extractText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  return (node.content ?? []).map(extractText).join(' ')
}

const MODES = [
  { id: 'draft', label: 'Draft' },
  { id: 'polish', label: 'Polish' },
  { id: 'continue', label: 'Continue' },
  { id: 'tone', label: 'Tone' },
]

const MODE_TITLES = {
  draft: 'AI Journal Draft',
  polish: 'Polish Writing',
  continue: 'Continue Writing',
  tone: 'Adjust Tone',
}

const TONE_OPTIONS = ['Casual', 'Poetic', 'Formal', 'Concise', 'Warm', 'Adventurous']

export default function AiDraftModal({ onClose }) {
  const { notebook, pages, currentPageId, elements, updateElement, addElement } = useEditorStore()
  const currentPage = pages.find(p => p.id === currentPageId)
  const targetTextEl = elements.find(e => e.pageId === currentPageId && e.type === 'text')

  const [mode, setMode] = useState('draft')
  const [tone, setTone] = useState('Casual')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? '')
  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showKey, setShowKey] = useState(!localStorage.getItem(KEY_STORAGE))

  const saveKey = () => {
    saveAiKey(apiKey)
    setShowKey(false)
  }

  const existingText = elements
    .filter(e => e.pageId === currentPageId && e.type === 'text' && e.data?.content)
    .map(e => extractText(e.data.content)).join(' ').trim().slice(0, 1200)

  const needsExistingText = mode !== 'draft'
  const blockedByNoText = needsExistingText && !existingText

  const switchMode = (m) => {
    setMode(m)
    setDraft('')
    setError('')
  }

  const buildInstruction = () => {
    if (mode === 'polish') {
      return `Here is a journal entry I wrote:\n\n"${existingText}"\n\nRewrite it to be more polished and vivid while keeping my voice, memories, and roughly the same length. Return only the rewritten text, no headers or labels.${prompt ? `\n\nAdditional guidance: ${prompt}` : ''}`
    }
    if (mode === 'continue') {
      return `Here is a journal entry I've started writing:\n\n"${existingText}"\n\nContinue writing from where I left off, in the same voice and style, for another 1-2 paragraphs. Return only the continuation (do not repeat what I already wrote), no headers or labels.${prompt ? `\n\nAdditional guidance: ${prompt}` : ''}`
    }
    if (mode === 'tone') {
      return `Here is a journal entry I wrote:\n\n"${existingText}"\n\nRewrite it in a more ${tone.toLowerCase()} tone, keeping the same memories and roughly the same length. Return only the rewritten text, no headers or labels.${prompt ? `\n\nAdditional guidance: ${prompt}` : ''}`
    }
    const context = [
      currentPage?.title && `Page title: ${currentPage.title}`,
      currentPage?.location && `Location: ${currentPage.location}`,
      currentPage?.date && `Date: ${currentPage.date}`,
      notebook?.name && `Journal: ${notebook.name}`,
      existingText && `Existing notes: "${existingText}"`,
      prompt && `My prompt: ${prompt}`,
    ].filter(Boolean).join('\n')
    return `You are helping someone write a travel journal entry. Write a vivid, personal 2–3 paragraph journal entry in first person based on this context:\n\n${context}\n\nWrite naturally, as if the person is reflecting on their day. Focus on sensory details and emotions. Do not include headers or labels — just the journal text.`
  }

  const generate = async () => {
    const key = localStorage.getItem(KEY_STORAGE)
    if (!key) { setShowKey(true); return }
    setLoading(true)
    setError('')
    setDraft('')
    try {
      const text = await callClaude({ apiKey: key, maxTokens: 400, messages: [{ role: 'user', content: buildInstruction() }] })
      setDraft(text)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const insertDraft = async () => {
    if (!draft) return
    const replacing = mode === 'polish' || mode === 'tone'
    const para = { type: 'paragraph', content: [{ type: 'text', text: draft }] }

    if (replacing && targetTextEl) {
      updateElement(targetTextEl.id, { data: { ...targetTextEl.data, content: { type: 'doc', content: [para] } } })
    } else if (targetTextEl) {
      const existingContent = targetTextEl.data.content?.content ?? []
      updateElement(targetTextEl.id, { data: { ...targetTextEl.data, content: { type: 'doc', content: [...existingContent, para] } } })
    } else {
      const el = await addElement('text')
      if (el) updateElement(el.id, { data: { ...el.data, content: { type: 'doc', content: [para] } } })
    }
    onClose()
  }

  const generateLabel = { draft: 'Generate draft', polish: 'Polish it', continue: 'Continue writing', tone: 'Rewrite tone' }[mode]
  const insertLabel = mode === 'polish' || mode === 'tone' ? 'Replace with this' : 'Insert into page'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <span className="text-amber-700">✦</span>
          <h2 className="text-base font-bold text-stone-900">{MODE_TITLES[mode]}</h2>
        </div>

        {!showKey && (
          <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  mode === m.id ? 'bg-white text-amber-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

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

        {!showKey && blockedByNoText && (
          <p className="text-xs text-stone-400 leading-relaxed text-center py-4">
            Add some writing to a text block on this page first, then come back to {mode === 'continue' ? 'continue it' : mode === 'tone' ? 'adjust its tone' : 'polish it'}.
          </p>
        )}

        {!showKey && !blockedByNoText && (
          <>
            {mode === 'draft' && (
              <div className="text-xs text-stone-400 bg-stone-50 rounded-lg px-3 py-2 space-y-0.5">
                {currentPage?.title && <p>📖 {currentPage.title}</p>}
                {currentPage?.location && <p>📍 {currentPage.location}</p>}
                {currentPage?.date && <p>📅 {currentPage.date}</p>}
                {!currentPage?.title && !currentPage?.location && !currentPage?.date && (
                  <p className="text-stone-300">Add a title, location, or date to the page for richer output.</p>
                )}
              </div>
            )}

            {needsExistingText && (
              <div className="text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2 max-h-20 overflow-y-auto leading-relaxed">
                {existingText}
              </div>
            )}

            {mode === 'tone' && (
              <div className="flex flex-wrap gap-1.5">
                {TONE_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                      tone === t ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs text-stone-400 mb-1.5">{mode === 'draft' ? 'Optional prompt' : 'Additional guidance (optional)'}</label>
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={mode === 'draft' ? 'e.g. We had the best pasta…' : 'e.g. focus on the food'}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            {draft && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">{draft}</p>
              </div>
            )}

            <div className="flex gap-2">
              {!draft ? (
                <button onClick={generate} disabled={loading}
                  className="flex-1 py-2 text-sm font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 transition-colors">
                  {loading ? 'Writing…' : generateLabel}
                </button>
              ) : (
                <>
                  <button onClick={generate} disabled={loading}
                    className="py-2 px-3 text-sm border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors text-stone-600">
                    {loading ? '…' : 'Regenerate'}
                  </button>
                  <button onClick={insertDraft}
                    className="flex-1 py-2 text-sm font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors">
                    {insertLabel}
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
