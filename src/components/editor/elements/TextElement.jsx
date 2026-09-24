import { useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { useEditorStore } from '../../../store/editorStore'
import { TEXT_STYLES } from '../../../data/textStyles'

export default function TextElement({ element }) {
  const updateElement = useEditorStore(s => s.updateElement)
  const saveTimer = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: element.data.content,
    onUpdate: ({ editor }) => {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        updateElement(element.id, {
          data: { ...element.data, content: editor.getJSON() },
        })
      }, 800)
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none cursor-text h-full',
        spellcheck: 'false',
      },
    },
  })

  useEffect(() => () => clearTimeout(saveTimer.current), [])

  const preset = TEXT_STYLES[element.data.textStyle] ?? {}
  const isPullQuote = element.data.textStyle === 'pullquote'
  const accent = '#c0813a'

  const bg = element.data.backgroundColor
  const hasBg = bg && bg !== 'transparent'

  return (
    <div
      className={`tiptap-content h-full w-full overflow-hidden px-3 py-2 ${isPullQuote ? 'flex flex-col justify-center' : ''}`}
      style={{
        fontFamily: element.data.fontFamily,
        fontSize: (element.data.fontSize ?? preset.fontSize ?? 16) + 'px',
        color: element.data.color ?? preset.color ?? '#2c2c2c',
        columnCount: (element.data.columns ?? 1) > 1 ? element.data.columns : undefined,
        columnGap: '1.5em',
        fontWeight: preset.fontWeight,
        fontStyle: preset.fontStyle,
        letterSpacing: preset.letterSpacing,
        lineHeight: preset.lineHeight,
        textAlign: preset.textAlign,
        textTransform: preset.textTransform,
        borderTop: isPullQuote ? `2px solid ${accent}` : undefined,
        borderBottom: isPullQuote ? `2px solid ${accent}` : undefined,
        backgroundColor: hasBg ? bg : undefined,
        padding: hasBg ? '12px 14px' : undefined,
      }}
    >
      <EditorContent editor={editor} style={{ height: '100%' }} />
    </div>
  )
}
