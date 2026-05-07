import { useState } from 'react'
import { detectMode, setDevMode, getStoredDevMode } from '@/config/mode'

const OPTIONS: { value: 'portal' | 'megaprice' | 'apteka' | 'analytic'; label: string }[] = [
  { value: 'portal',    label: 'Portal (Lekko)' },
  { value: 'megaprice', label: 'Megaprice standalone' },
  { value: 'apteka',    label: 'Apteka standalone' },
  { value: 'analytic',  label: 'Analytic standalone' },
]

function isDevHost(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h === ''
}

export function DevModeSwitcher() {
  const [open, setOpen] = useState(false)

  if (!isDevHost()) return null

  const current = detectMode()
  const stored = getStoredDevMode()
  const currentLabel = current.mode === 'portal' ? 'Portal' : (current.productId ?? 'megaprice')

  return (
    <div className="fixed bottom-3 right-3 z-[100] font-sans text-xs">
      {open && (
        <div className="mb-2 w-[200px] rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <div className="mb-1 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-[#929292]">
            Dev mode
          </div>
          {OPTIONS.map((opt) => {
            const active = stored === opt.value || (!stored && current.mode === 'standalone' && current.productId === opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => setDevMode(opt.value)}
                className={
                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors ' +
                  (active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100')
                }
              >
                <span>{opt.label}</span>
                {active && <span className="text-[10px]">●</span>}
              </button>
            )
          })}
          <div className="my-1 h-px bg-gray-100" />
          <button
            onClick={() => setDevMode('reset')}
            className="flex w-full rounded-md px-2 py-1.5 text-left text-gray-500 transition-colors hover:bg-gray-100"
          >
            Сбросить (по hostname)
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-gray-900 px-3 py-1.5 text-white shadow-md transition-colors hover:bg-gray-700"
        title="Переключить режим (только в dev)"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
        <span className="font-medium">dev:</span>
        <span>{currentLabel}</span>
      </button>
    </div>
  )
}
