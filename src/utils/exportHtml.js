function tiptapToHtml(node) {
  if (!node) return ''
  if (node.type === 'text') {
    let t = (node.text ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const marks = node.marks ?? []
    if (marks.find(m => m.type === 'bold')) t = `<strong>${t}</strong>`
    if (marks.find(m => m.type === 'italic')) t = `<em>${t}</em>`
    if (marks.find(m => m.type === 'underline')) t = `<u>${t}</u>`
    return t
  }
  const inner = (node.content ?? []).map(tiptapToHtml).join('')
  const type = node.type
  if (type === 'doc') return inner
  if (type === 'paragraph') return inner ? `<p>${inner}</p>` : '<p><br></p>'
  if (type === 'heading') return `<h${node.attrs?.level ?? 2}>${inner}</h${node.attrs?.level ?? 2}>`
  if (type === 'bulletList') return `<ul>${inner}</ul>`
  if (type === 'orderedList') return `<ol>${inner}</ol>`
  if (type === 'listItem') return `<li>${inner}</li>`
  if (type === 'blockquote') return `<blockquote>${inner}</blockquote>`
  if (type === 'hardBreak') return '<br>'
  return inner
}

async function toBase64(url) {
  try {
    const r = await fetch(url)
    const blob = await r.blob()
    return await new Promise((resolve) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result)
      fr.onerror = () => resolve(url)
      fr.readAsDataURL(blob)
    })
  } catch { return url }
}

export async function exportNotebookHtml({ notebook, pages, elements, onProgress }) {
  // Group elements by page
  const byPage = {}
  for (const el of elements) {
    if (!byPage[el.pageId]) byPage[el.pageId] = []
    byPage[el.pageId].push(el)
  }

  // Inline thumbnail images as base64
  const imageEls = elements.filter(e => e.type === 'image' && e.data?.thumbnailUrl)
  const imageMap = {}
  let done = 0
  await Promise.all(imageEls.map(async (e) => {
    if (!imageMap[e.data.thumbnailUrl]) {
      imageMap[e.data.thumbnailUrl] = await toBase64(e.data.thumbnailUrl)
    }
    onProgress?.(++done, imageEls.length)
  }))

  const accent = notebook?.theme?.accentColor ?? '#c0813a'
  const bgColor = notebook?.theme?.backgroundColor ?? '#ffffff'

  const pagesHtml = pages.map((page) => {
    const els = (byPage[page.id] ?? []).sort((a, b) => (a.grid?.y ?? 0) - (b.grid?.y ?? 0) || (a.grid?.x ?? 0) - (b.grid?.x ?? 0))

    const elHtml = els.map(el => {
      if (el.type === 'text' && el.data?.content) {
        return `<div class="text-block">${tiptapToHtml(el.data.content)}</div>`
      }
      if (el.type === 'image' && el.data?.thumbnailUrl) {
        const src = imageMap[el.data.thumbnailUrl] ?? el.data.thumbnailUrl
        const cap = el.data.caption ? `<figcaption>${el.data.caption.replace(/</g, '&lt;')}</figcaption>` : ''
        return `<figure class="image-block"><img src="${src}" alt="" loading="lazy">${cap}</figure>`
      }
      return ''
    }).filter(Boolean).join('')

    const titleHtml = page.title ? `<h2 class="page-title">${page.title.replace(/</g, '&lt;')}</h2>` : ''
    const metaParts = [page.location, page.date].filter(Boolean)
    const metaHtml = metaParts.length ? `<p class="page-meta">${metaParts.join(' · ')}</p>` : ''

    return `<article id="page-${page.id}" class="page">
  ${titleHtml || metaHtml ? `<header class="page-header">${titleHtml}${metaHtml}</header>` : ''}
  <div class="page-content">${elHtml || '<p class="empty-page">No content</p>'}</div>
</article>`
  }).join('\n\n')

  const coverHtml = notebook.coverPhotoUrl
    ? `<div class="cover"><img src="${notebook.coverPhotoUrl}" alt="Cover" loading="lazy"></div>`
    : ''

  const titledPages = pages.filter(p => p.title)
  const tocHtml = titledPages.length >= 3
    ? `<nav class="toc"><h2>Contents</h2><ul>${titledPages.map(p => `<li><a href="#page-${p.id}">${p.title.replace(/</g, '&lt;')}</a></li>`).join('')}</ul></nav>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${(notebook.name ?? 'Travel Journal').replace(/</g, '&lt;')}</title>
<style>
:root { --accent: ${accent}; --bg: ${bgColor}; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Georgia, 'Times New Roman', serif; background: #f5f0e8; color: #2c2c2c; line-height: 1.65; }
.journal-header { text-align: center; padding: 3rem 2rem 2rem; border-bottom: 3px solid var(--accent); }
.cover img { width: 100%; max-height: 45vh; object-fit: cover; margin-bottom: 1.5rem; border-radius: 6px; }
.journal-title { font-size: 2.5rem; color: #1a1a1a; margin-bottom: 0.4rem; }
.journal-desc { font-size: 1rem; color: #888; }
.toc { max-width: 720px; margin: 2rem auto; padding: 0 1.5rem; }
.toc h2 { font-size: 0.75rem; color: var(--accent); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 1rem; }
.toc ul { list-style: none; }
.toc li { padding: 0.25rem 0; border-bottom: 1px solid #e8e3da; }
.toc a { text-decoration: none; color: #555; font-size: 0.9rem; }
.toc a:hover { color: var(--accent); }
.page { max-width: 720px; margin: 2rem auto; padding: 1.5rem 2rem; background: var(--bg); border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.10); }
.page-header { border-bottom: 2px solid var(--accent); padding-bottom: 0.75rem; margin-bottom: 1.25rem; }
.page-title { font-size: 1.6rem; color: #1a1a1a; }
.page-meta { font-size: 0.75rem; color: var(--accent); margin-top: 0.3rem; letter-spacing: .05em; }
.page-content { display: flex; flex-direction: column; gap: 1rem; }
.text-block { font-size: 0.95rem; }
.text-block p { margin-bottom: 0.5em; }
.text-block h2 { font-size: 1.4rem; margin: 0.8em 0 0.3em; }
.text-block h3 { font-size: 1.15rem; margin: 0.8em 0 0.3em; }
.text-block ul, .text-block ol { padding-left: 1.5em; margin-bottom: 0.5em; }
.text-block blockquote { border-left: 3px solid var(--accent); padding-left: 1em; color: #666; margin: 0.5em 0; }
.image-block { margin: 0; }
.image-block img { width: 100%; border-radius: 4px; display: block; }
.image-block figcaption { font-size: 0.75rem; color: #888; text-align: center; padding: 0.3rem 0; font-style: italic; }
.empty-page { color: #ccc; font-style: italic; font-size: 0.9rem; }
@media (max-width: 600px) { .page { padding: 1rem; } .journal-title { font-size: 1.75rem; } }
@media print { body { background: white; } .page { box-shadow: none; page-break-after: always; } }
</style>
</head>
<body>
<div class="journal-header">
  ${coverHtml}
  <h1 class="journal-title">${(notebook.name ?? 'Travel Journal').replace(/</g, '&lt;')}</h1>
  ${notebook.description ? `<p class="journal-desc">${notebook.description.replace(/</g, '&lt;')}</p>` : ''}
</div>
${tocHtml}
${pagesHtml}
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(notebook.name ?? 'journal').replace(/[<>:"/\\|?*\r\n]/g, '-')}.html`
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
}
