import type { ReactNode } from 'react'
import type { NeedStatus } from '@/products/megaprice/mocks/need.mocks'

export type ScenarioKey = 'urgent' | 'oos' | 'overstock' | 'dead' | 'all'
export type PeriodKey   = '7d' | '30d' | '90d' | '1y' | 'custom'
export type ColKey      = 'status' | 'stock' | 'doc' | 'sales' | 'need'

export type ColWidths = Record<ColKey, number>

export interface PharmacyBreakdown {
  id: string
  name: string
  stock: number
  sales30d: number
  avgDailySales: number
  daysOfCover: number
  status: NeedStatus
}

export interface BranchData {
  name:        string
  stock:       number
  dailySales:  number
  daysOfCover: number
  expiryDays:  number
}

export interface AIRec {
  id:           string
  severity:     'red' | 'orange' | 'blue'
  icon:         ReactNode
  badgeLabel:   string
  title:        string
  headline:     string
  tableHeaders?: [string, string, string]
  tableRows?:    [string, string, string][]
  analysis?:    string
  loss?:        string
  steps:        string[]
}
