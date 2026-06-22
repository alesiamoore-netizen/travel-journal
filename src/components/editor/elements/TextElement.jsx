import { useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { useEditorStore } from '../../../store/editorStore'

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

  return (
    <div
      className="tiptap-content h-full w-full overflow-hidden px-3 py-2"
      style={{
        fontFamily: element.data.fontFamily,
        fontSize: element.data.fontSize + 'px',
        color: element.data.color,
        columnCount: element.data.columns > 1 ? element.data.columns : undefined,
        columnGap: '1.5em',
      }}
    >
      <EditorContent editor={editor} style={{ height: '100%' }} />
    </div>
  )
}
