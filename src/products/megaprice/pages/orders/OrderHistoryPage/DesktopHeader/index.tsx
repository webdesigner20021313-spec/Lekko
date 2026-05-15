import { useRef, useEffect } from 'react'
import { Search, Calendar, X, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { applyDateMask, ISOtoDMY } from '../helpers'
import { RangeCalendar } from '../RangeCalendar'

/** Desktop top bar: поиск + date-range input/calendar + Excel-кнопка. */
export function DesktopHeader({
  search,
  setSearch,
  dateRange,
  setDateRange,
  calFrom,
  calTo,
  setCalFrom,
  setCalTo,
  calendarOpen,
  setCalendarOpen,
  onExport,
}: {
  search: string
  setSearch: (v: string) => void
  dateRange: string
  setDateRange: (v: string) => void
  calFrom: string
  calTo: string
  setCalFrom: (v: string) => void
  setCalTo: (v: string) => void
  calendarOpen: boolean
  setCalendarOpen: (v: boolean | ((p: boolean) => boolean)) => void
  onExport: () => void
}) {
  const { t } = useTranslation()
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!calendarOpen) return
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [calendarOpen, setCalendarOpen])

  return (
    <div className="hidden md:flex md:flex-wrap md:items-center md:gap-3">
      <div className="flex w-full items-center gap-3 md:w-auto">
        <div className="relative flex-1 md:w-60 md:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('orders_search_ph')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:border-gray-700 dark:bg-[#111111] dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative" ref={calendarRef}>
          <div className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-[#111111]">
            <input
              type="text"
              placeholder={t('orders_date_ph')}
              value={dateRange}
              onChange={e => setDateRange(applyDateMask(e.target.value.replace(/\D/g, '')))}
              className="border-0 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none dark:text-gray-300 dark:placeholder-gray-500"
              style={{ width: '21ch' }}
            />
            {dateRange && (
              <button
                type="button"
                onClick={() => { setDateRange(''); setCalFrom(''); setCalTo('') }}
                className="flex shrink-0 items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCalendarOpen(v => !v)}
              className="flex shrink-0 items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>

          {calendarOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-[#222222]">
              <RangeCalendar
                from={calFrom}
                to={calTo}
                onChange={(f, to) => {
                  setCalFrom(f)
                  setCalTo(to)
                  if (f && to) {
                    setDateRange(`${ISOtoDMY(f)} - ${ISOtoDMY(to)}`)
                    setCalendarOpen(false)
                  } else {
                    setDateRange(f ? ISOtoDMY(f) : '')
                  }
                }}
              />
              {(calFrom || calTo) && (
                <button
                  type="button"
                  onClick={() => { setCalFrom(''); setCalTo(''); setDateRange(''); setCalendarOpen(false) }}
                  className="mt-2 w-full text-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {t('orders_date_clear')}
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onExport}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-green-600 bg-green-600 px-3 text-sm font-medium text-white transition-colors hover:border-green-700 hover:bg-green-700"
        >
          <Download className="h-3.5 w-3.5" />
          Excel
        </button>
      </div>
    </div>
  )
}
