import { useEffect, useState } from 'react'

/**
 * Возвращает значение с задержкой `delay` мс. Каждый input сбрасывает таймер.
 * Используется в search-полях, чтобы не дёргать API на каждую клавишу.
 *
 *   const [query, setQuery] = useState('')
 *   const debounced = useDebouncedValue(query, 300)
 *   // useDebounced меняется через 300мс после последнего setQuery.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
