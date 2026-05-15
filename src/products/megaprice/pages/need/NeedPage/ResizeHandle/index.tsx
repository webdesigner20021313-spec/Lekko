import type { MouseEvent } from 'react'

export function ResizeHandle({ onMouseDown }: { onMouseDown: (e: MouseEvent) => void }) {
  return (
    <div
      draggable={false}
      onDragStart={e => e.preventDefault()}
      onMouseDown={onMouseDown}
      style={{ position: 'absolute', right: 0, top: 0, width: 4, height: '100%', cursor: 'col-resize', zIndex: 10 }}
      className="hover:bg-blue-400 active:bg-blue-500"
    />
  )
}
