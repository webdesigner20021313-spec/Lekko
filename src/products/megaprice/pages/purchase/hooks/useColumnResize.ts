import { useState, useCallback } from 'react'

export function useColumnResize(initialWidths: number[]) {
  const [widths, setWidths] = useState<number[]>(initialWidths)

  const startResize = useCallback((colIndex: number, startX: number) => {
    const startWidth = widths[colIndex]

    function onMouseMove(e: MouseEvent) {
      const delta = e.clientX - startX
      const newWidth = Math.max(40, startWidth + delta)
      setWidths((prev) => prev.map((w, i) => (i === colIndex ? newWidth : w)))
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [widths])

  const totalWidth = widths.reduce((a, b) => a + b, 0)

  return { widths, totalWidth, startResize }
}
