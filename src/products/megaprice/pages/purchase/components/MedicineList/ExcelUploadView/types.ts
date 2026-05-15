export interface ParseError { row: number; message: string }
export interface ParsedRow   { rowNum: number; name: string; mnn: string; manufacturer: string; country: string }

// Column mapping: index in Excel sheet (-1 = not mapped)
export interface ColMap {
  name:         number
  mnn:          number
  manufacturer: number
  country:      number
}

// Step machine
export type Step = 'idle' | 'mapping' | 'results' | 'error'

export const PREVIEW_ROWS = 5
const COL_LETTERS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function colLabel(i: number) {
  return i < 26 ? COL_LETTERS[i] : `${COL_LETTERS[Math.floor(i / 26) - 1]}${COL_LETTERS[i % 26]}`
}
