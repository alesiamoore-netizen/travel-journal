import { useRef, useState } from 'react'

export default function DropZone({ onFiles, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files)
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer select-none transition-all py-6 px-4 ${
        dragging
          ? 'border-amber-500 bg-amber-50 scale-[1.02]'
          : disabled
          ? 'border-stone-200 bg-stone-50 opacity-60 cursor-not-allowed'
          : 'border-stone-300 bg-white hover:border-amber-400 hover:bg-amber-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) onFiles(e.target.files) }}
      />
      <span className="text-3xl">{disabled ? '⏳' : '📷'}</span>
      <span className="text-sm font-semibold text-stone-700">
        {disabled ? 'Uploading…' : 'Add Photos'}
      </span>
      <span className="text-xs text-stone-400 text-center leading-tight">
        {disabled ? 'Please wait' : 'Click or drag & drop'}
      </span>
    </div>
  )
}
