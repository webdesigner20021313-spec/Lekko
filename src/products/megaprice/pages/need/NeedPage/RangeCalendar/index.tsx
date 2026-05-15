import { useState, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { fmtDate, toISO } from '../helpers'

export function RangeCalendar({ from, to, onChange }: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  const { t, i18n } = useTranslation()
  const today    = new Date()
  const [vy, setVy] = useState(today.getFullYear())
  const [vm, setVm] = useState(today.getMonth())
  const [hover, setHover] = useState('')

  const locale = i18n.language === 'uz' ? 'uz-Latn-UZ' : 'ru-RU'

  const MONTHS = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const s = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2025, i, 1))
      return s.charAt(0).toUpperCase() + s.slice(1)
    }), [locale]
  )

  const DAYS = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const s = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2025, 0, 6 + i))
      return s.charAt(0).toUpperCase() + s.slice(1)
    }), [locale]
  )

  const prevM = () => { if (vm === 0) { setVy(y => y-1); setVm(11) } else setVm(m => m-1) }
  const nextM = () => { if (vm === 11) { setVy(y => y+1); setVm(0)  } else setVm(m => m+1) }

  const cells = useMemo(() => {
    const first = new Date(vy, vm, 1)
    const last  = new Date(vy, vm + 1, 0)
    const pad   = (first.getDay() + 6) % 7
    const arr: (Date | null)[] = Array(pad).fill(null)
    for (let d = 1; d <= last.getDate(); d++) arr.push(new Date(vy, vm, d))
    return arr
  }, [vy, vm])

  function handleClick(date: Date) {
    const iso = toISO(date)
    if (!from || (from && to)) onChange(iso, '')
    else if (iso >= from) onChange(from, iso)
    else onChange(iso, from)
  }

  const todayISO = toISO(today)

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={prevM} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronDown className="h-3.5 w-3.5 rotate-90" />
        </button>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{MONTHS[vm]} {vy}</span>
        <button onClick={nextM} className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-[#929292]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} />
          const iso  = toISO(date)
          const end  = to || hover
          const lo   = from && end ? (from <= end ? from : end) : from
          const hi   = from && end ? (from <= end ? end  : from) : ''
          const isF  = iso === from
          const isT  = iso === (to || (from && hover ? hover : ''))
          const inR  = !!lo && !!hi && iso > lo && iso < hi
          const isTod = iso === todayISO
          return (
            <button key={iso}
              onClick={() => handleClick(date)}
              onMouseEnter={() => { if (from && !to) setHover(iso) }}
              onMouseLeave={() => setHover('')}
              className={cn(
                'h-7 w-full text-xs transition-colors',
                (isF || isT) ? 'rounded-full bg-gray-900 font-semibold text-white dark:bg-[#f1f1f1] dark:text-gray-900'
                  : inR ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  : cn('rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700', isTod && 'font-bold'),
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-center text-[10px] text-gray-400 dark:text-[#929292]">
        {!from ? t('need_cal_pick_start') : !to ? t('need_cal_pick_end') : `${fmtDate(from)} — ${fmtDate(to)}`}
      </p>
    </div>
  )
}
