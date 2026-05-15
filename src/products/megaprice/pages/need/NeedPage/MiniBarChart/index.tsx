import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export function MiniBarChart({ data }: { data: number[] }) {
  const { t, i18n } = useTranslation()
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartW, setChartW] = useState(296)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(e => setChartW(Math.floor(e[0].contentRect.width)))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const locale = i18n.language === 'uz' ? 'uz-Latn-UZ' : 'ru-RU'
  const MONTHS_SHORT = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const monthIndex = (4 + i) % 12
      return new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2025, monthIndex, 1))
    }), [locale]
  )

  const max = Math.max(...data, 1)
  const W = chartW; const H = 72; const gap = 3
  const bw = Math.floor((W - gap * (data.length - 1)) / data.length)

  const hovBh    = hoveredIdx !== null ? Math.max(3, (data[hoveredIdx] / max) * H) : 0
  const tooltipX = hoveredIdx !== null ? hoveredIdx * (bw + gap) + bw / 2 : 0
  const tooltipY = hoveredIdx !== null ? H - hovBh - 26 : 0

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          left: tooltipX,
          top: Math.max(0, tooltipY),
          transform: 'translateX(-50%)',
          background: 'var(--chart-tooltip-bg)',
          color: 'var(--chart-tooltip-color)',
          borderRadius: 6,
          padding: '3px 8px',
          fontSize: 11,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          {MONTHS_SHORT[hoveredIdx]}: {t('need_pcs_n', { n: data[hoveredIdx] })}
        </div>
      )}
      <svg width="100%" height={H + 14} style={{ overflow: 'visible', display: 'block' }}>
        {data.map((v, i) => {
          const bh     = Math.max(3, (v / max) * H)
          const x      = i * (bw + gap)
          const isHov  = hoveredIdx === i
          const isLast = i === data.length - 1
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}>
              <rect x={x} y={0} width={bw} height={H} fill="transparent" />
              <rect x={x} y={H - bh} width={bw} height={bh} rx={2}
                style={{ fill: isHov ? 'var(--chart-bar-hover)' : isLast ? 'var(--chart-bar-last)' : 'var(--chart-bar)' }} />
              {(i === 0 || i === 5 || i === 11) && (
                <text x={x + bw / 2} y={H + 12} textAnchor="middle" fontSize={9} style={{ fill: 'var(--chart-text)' }}>
                  {MONTHS_SHORT[i]}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
