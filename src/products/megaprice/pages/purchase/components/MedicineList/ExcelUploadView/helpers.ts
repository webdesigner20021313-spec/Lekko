import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'
import type { ColMap, ParseError, ParsedRow } from './types'

export function autoDetect(headers: string[]): ColMap {
  const find = (...kw: string[]) =>
    headers.findIndex(h => kw.some(k => h.toLowerCase().includes(k.toLowerCase())))
  return {
    name:         find('назван', 'наимен', 'препарат', 'лекарств', 'товар', 'продукт'),
    mnn:          find('мнн', 'mnn', 'международн', 'непатент'),
    manufacturer: find('произв', 'фирм', 'бренд', 'компан'),
    country:      find('стран', 'country'),
  }
}

export function applyMapping(
  rawData: unknown[][],
  map: ColMap,
  errNoNameCol: string,
  errNoRows: string,
): { rows: ParsedRow[]; errors: ParseError[] } {
  const errors: ParseError[] = []
  const rows:   ParsedRow[]  = []

  if (map.name === -1 && map.mnn === -1) {
    errors.push({ row: 0, message: errNoNameCol })
    return { rows, errors }
  }

  rawData.slice(1).forEach((row, i) => {
    const rowNum = i + 2
    const name   = map.name         !== -1 ? String((row as string[])[map.name]         ?? '').trim() : ''
    const mnn    = map.mnn          !== -1 ? String((row as string[])[map.mnn]          ?? '').trim() : ''
    if (!name && !mnn) return
    const manufacturer = map.manufacturer !== -1 ? String((row as string[])[map.manufacturer] ?? '').trim() : ''
    const country      = map.country      !== -1 ? String((row as string[])[map.country]      ?? '').trim() : ''
    rows.push({ rowNum, name, mnn, manufacturer, country })
  })

  if (rows.length === 0) errors.push({ row: 0, message: errNoRows })
  return { rows, errors }
}

export function matchWithCatalog(rows: ParsedRow[], catalog: Medicine[]) {
  const medicines: Medicine[] = []
  const unmatchedIds = new Set<string>()

  rows.forEach(row => {
    let matched: Medicine | undefined
    if (row.mnn) {
      const q = row.mnn.toLowerCase()
      matched = catalog.find(m =>
        m.mnn.toLowerCase() === q || (m.mnnLatin != null && m.mnnLatin.toLowerCase() === q)
      )
    }
    if (!matched && row.name) {
      matched = catalog.find(m => m.name.toLowerCase() === row.name.toLowerCase())
    }
    if (matched) {
      if (!medicines.find(m => m.id === matched!.id)) medicines.push(matched)
    } else {
      const stubId = `unmatched-${row.rowNum}`
      if (!medicines.find(m => m.id === stubId)) {
        medicines.push({ id: stubId, name: row.name || row.mnn || `Строка ${row.rowNum}`, mnn: row.mnn, manufacturer: row.manufacturer || '—', country: row.country || '—', isFavorite: false })
        unmatchedIds.add(stubId)
      }
    }
  })
  return { medicines, unmatchedIds }
}
