export const AI_KEY_STORAGE = 'travel_journal_ai_key'

export function getAiKey() {
  return localStorage.getItem(AI_KEY_STORAGE)
}

export function saveAiKey(key) {
  localStorage.setItem(AI_KEY_STORAGE, key.trim())
}

export async function callClaude({ messages, maxTokens = 400, apiKey }) {
  const key = apiKey ?? getAiKey()
  if (!key) throw new Error('No API key set')
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
      max_tokens: maxTokens,
      messages,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'API error')
  return data.content?.[0]?.text ?? ''
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function generateImageCaption({ imageUrl, context, apiKey }) {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error('Could not load image')
  const blob = await res.blob()
  const mediaType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg'
  const base64 = await blobToBase64(blob)

  const instruction = [
    'Write a short, natural one-sentence caption for this travel photo, as if for a travel journal.',
    context && `Context: ${context}`,
    'Do not use quotation marks. Do not include a period-separated label. Just the caption text.',
  ].filter(Boolean).join('\n')

  const text = await callClaude({
    apiKey,
    maxTokens: 80,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: instruction },
      ],
    }],
  })
  return text.trim().replace(/^"|"$/g, '')
}
