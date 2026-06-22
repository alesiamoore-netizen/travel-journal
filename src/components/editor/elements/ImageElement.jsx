export default function ImageElement({ element }) {
  return (
    <div className="h-full w-full bg-stone-100 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-2 text-stone-400 select-none">
      <span className="text-4xl">🖼</span>
      <span className="text-xs font-medium">Image block</span>
      <span className="text-xs opacity-60">Upload coming in Phase 3</span>
    </div>
  )
}
