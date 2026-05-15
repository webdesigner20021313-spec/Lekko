import { ArrowRightLeft, AlertTriangle, ShoppingCart as CartIcon, TrendingDown } from 'lucide-react'
import { mockNeedItems, type NeedItem, type NeedStatus } from '@/products/megaprice/mocks/need.mocks'
import { mockSupplierOffers } from '@/products/megaprice/mocks/purchase.mocks'
import type { SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { BRANCH_NAMES, PHARMACIES, STATUS_ORDER } from './config'
import type { AIRec, BranchData, PharmacyBreakdown } from './types'

// ─── Pharmacies / mock-data ──────────────────────────────────────────────────

export function getItemPharmacies(item: NeedItem): PharmacyBreakdown[] {
  const seed      = item.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const baseFracs = [0.26, 0.22, 0.19, 0.14, 0.10, 0.06, 0.03]
  return PHARMACIES.map((ph, i) => {
    const fi            = (i + seed) % baseFracs.length
    const frac          = baseFracs[fi]
    const sales30d      = Math.max(0, Math.round(item.sales30d * frac))
    const avgDailySales = parseFloat((item.avgDailySales * frac).toFixed(1))
    const stockBase     = item.status === 'oos' ? 0 : item.stock * frac * (1 + ((seed + i) % 3) * 0.15)
    const stock         = Math.round(stockBase)
    const daysOfCover   = avgDailySales > 0 ? stock / avgDailySales : 0
    let status: NeedStatus
    if (stock === 0) status = 'oos'
    else if (daysOfCover < 7) status = 'critical'
    else if (daysOfCover > 30) status = 'overstock'
    else status = 'normal'
    return { ...ph, stock, sales30d, avgDailySales, daysOfCover, status }
  })
}

export function getPharmacyItems(pharmacyId: string): NeedItem[] {
  return mockNeedItems.flatMap(item => {
    const phData = getItemPharmacies(item).find(ph => ph.id === pharmacyId)
    if (!phData || (phData.stock === 0 && phData.sales30d === 0)) return []
    const salesRatio = item.avgDailySales > 0 ? phData.avgDailySales / item.avgDailySales : 0
    return [{
      ...item,
      stock:            phData.stock,
      avgDailySales:    phData.avgDailySales,
      sales30d:         phData.sales30d,
      sales7d:          Math.round(item.sales7d * salesRatio),
      daysOfCover:      phData.daysOfCover,
      status:           phData.status,
      optimalStock:     Math.max(1, Math.round(item.optimalStock * salesRatio)),
      lostRevenuePerDay: phData.status === 'oos' ? item.lostRevenuePerDay * salesRatio : 0,
      frozenAmount:     (phData.status === 'overstock' || phData.status === 'dead')
        ? item.frozenAmount * (item.stock > 0 ? phData.stock / item.stock : 0)
        : 0,
      recommendedQty:   Math.max(0, Math.ceil(phData.avgDailySales * 7) - phData.stock),
    }]
  })
}

export function getMultiPharmacyItems(ids: string[]): NeedItem[] {
  if (ids.length === 0) return mockNeedItems
  if (ids.length === 1) return getPharmacyItems(ids[0])
  return mockNeedItems.flatMap(item => {
    const phList = getItemPharmacies(item).filter(ph => ids.includes(ph.id))
    if (phList.length === 0) return []
    const stockSum    = phList.reduce((s, ph) => s + ph.stock, 0)
    const salesSum    = parseFloat(phList.reduce((s, ph) => s + ph.avgDailySales, 0).toFixed(1))
    const sales30dSum = phList.reduce((s, ph) => s + ph.sales30d, 0)
    if (stockSum === 0 && sales30dSum === 0) return []
    const salesRatio  = item.avgDailySales > 0 ? salesSum / item.avgDailySales : 0
    const daysOfCover = salesSum > 0 ? stockSum / salesSum : 0
    let status: NeedStatus
    if (stockSum === 0) status = 'oos'
    else if (daysOfCover < 7) status = 'critical'
    else if (daysOfCover > 30) status = 'overstock'
    else status = 'normal'
    return [{
      ...item,
      stock:             stockSum,
      avgDailySales:     salesSum,
      sales30d:          sales30dSum,
      sales7d:           Math.round(item.sales7d * salesRatio),
      daysOfCover,
      status,
      optimalStock:      Math.max(1, Math.round(item.optimalStock * salesRatio)),
      lostRevenuePerDay: status === 'oos' ? item.lostRevenuePerDay * salesRatio : 0,
      frozenAmount:      (status === 'overstock')
        ? item.frozenAmount * (item.stock > 0 ? stockSum / item.stock : 0)
        : 0,
      recommendedQty:    Math.max(0, Math.ceil(salesSum * 7) - stockSum),
    }]
  })
}

// ─── Calculations ────────────────────────────────────────────────────────────

export function calcRecommendedQty(item: NeedItem, days: number): number {
  if (item.status === 'overstock' || item.status === 'dead') return 0
  return Math.max(0, Math.ceil(item.avgDailySales * days) - item.stock)
}

export function calcKpi(items: NeedItem[], periodDays: number) {
  const oos       = items.filter(i => i.status === 'oos')
  const critical  = items.filter(i => i.status === 'critical')
  const overstock = items.filter(i => i.status === 'overstock' || i.status === 'dead')
  const urgent    = items.filter(i => i.status === 'oos' || i.status === 'critical')
  const lostPerDay     = oos.reduce((s, i) => s + i.lostRevenuePerDay, 0)
  const frozenTotal    = overstock.reduce((s, i) => s + i.frozenAmount, 0)
  const orderTotal     = items.reduce((s, i) => s + calcRecommendedQty(i, periodDays) * i.costPrice, 0)
  const orderCount     = items.filter(i => calcRecommendedQty(i, periodDays) > 0).length
  const urgentTotal    = urgent.reduce((s, i) => s + calcRecommendedQty(i, periodDays) * i.costPrice, 0)
  const urgentCount    = urgent.filter(i => calcRecommendedQty(i, periodDays) > 0).length
  return { oos, critical, overstock, lostPerDay, frozenTotal, orderTotal, orderCount, urgentTotal, urgentCount }
}

export function defaultSort(a: NeedItem, b: NeedItem) {
  const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  if (so !== 0) return so
  return b.avgDailySales - a.avgDailySales
}

export function getBestOffer(medicineId: string) {
  return mockSupplierOffers
    .filter(o => o.medicineId === medicineId)
    .sort((a, b) => a.priceWithVat - b.priceWithVat)[0] ?? null
}

export function getAllOffers(medicineId: string): SupplierOffer[] {
  return mockSupplierOffers
    .filter(o => o.medicineId === medicineId)
    .sort((a, b) => a.priceWithVat - b.priceWithVat)
}

// ─── Date helpers ────────────────────────────────────────────────────────────

export function toISO(d: Date) { return d.toISOString().slice(0, 10) }
export function fmtDate(iso: string) {
  if (!iso) return ''
  const [y, m, day] = iso.split('-')
  return `${day}.${m}.${y}`
}

// ─── AI recommendations (branch-level) ───────────────────────────────────────

function seededNum(seed: string, idx: number, min: number, max: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) ^ idx * 2654435761
  return min + Math.abs(h) % (max - min + 1)
}

function shortBranch(name: string) { return name.replace(/^Филиал №\d+\s*/, '') }

function buildBranchData(item: NeedItem): BranchData[] {
  const seed    = item.id
  const count   = 3 + (seededNum(seed, 99, 0, 1))
  const branches: BranchData[] = []
  let remainStock = item.stock
  let remainSales = item.avgDailySales
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1
    const stockShare = isLast ? remainStock : Math.round(remainStock * seededNum(seed, i * 10, 15, 55) / 100)
    const salesShare = isLast ? Math.max(0, remainSales) : parseFloat((remainSales * seededNum(seed, i * 10 + 1, 5, 50) / 100).toFixed(1))
    let effectiveSales = salesShare
    if ((item.status === 'dead' || item.status === 'overstock') && i === count - 1) effectiveSales = 0
    const daysOfCover = effectiveSales > 0 ? Math.round(stockShare / effectiveSales) : 999
    const expiryDays  = seededNum(seed, i * 10 + 5, 20, 180)
    branches.push({ name: BRANCH_NAMES[i], stock: Math.max(0, stockShare), dailySales: parseFloat(effectiveSales.toFixed(1)), daysOfCover, expiryDays })
    remainStock -= stockShare
    remainSales -= salesShare
  }
  return branches
}

export function getAIRecommendations(item: NeedItem): AIRec[] {
  const recs: AIRec[] = []
  const fmt  = (n: number) => Math.round(n).toLocaleString('ru-RU')
  const branches = buildBranchData(item)

  const noSalesBranches    = branches.filter(b => b.dailySales === 0)
  const goodBranches       = branches.filter(b => b.dailySales >= 1.5).sort((a, b) => b.dailySales - a.dailySales)
  const expiryRiskBranches = branches.filter(b => b.expiryDays < 45 && b.stock > 0)
  const networkDailySales  = branches.reduce((s, b) => s + b.dailySales, 0)

  if (noSalesBranches.length > 0 && goodBranches.length > 0 && item.stock > 0) {
    const transferQty = noSalesBranches.reduce((s, b) => s + b.stock, 0)
    const canAbsorb   = goodBranches.filter(b => {
      const afterTransfer = b.stock + Math.round(transferQty / goodBranches.length)
      const projectedDoc  = b.dailySales > 0 ? afterTransfer / b.dailySales : 999
      return projectedDoc <= b.expiryDays
    })
    const safeTargets = canAbsorb.length > 0 ? canAbsorb : goodBranches.slice(0, 2)
    const perBranch   = Math.round(transferQty / safeTargets.length)
    const riskyBranch = goodBranches.find(b => !canAbsorb.includes(b))
    const tableRows = noSalesBranches.map(b => [shortBranch(b.name), '0 шт./день', `${fmt(b.stock)} шт.`] as [string, string, string])
    const minExp = Math.min(...noSalesBranches.map(b => b.expiryDays))
    const analysisParts = noSalesBranches.some(b => b.expiryDays < 90)
      ? [`${fmt(transferQty)} шт. стоят без продаж, а срок годности через ${minExp} дн. Не перевезти сейчас — товар спишется.`]
      : [`${fmt(transferQty)} шт. стоят без движения — деньги заморожены. В других точках этот товар уходит хорошо.`]
    const steps: string[] = []
    noSalesBranches.forEach(b => { steps.push(`Забрать ${fmt(b.stock)} шт. из ${shortBranch(b.name)}`) })
    const totalTargetSales = safeTargets.reduce((s, b) => s + b.dailySales, 0)
    safeTargets.forEach(b => {
      const portion = totalTargetSales > 0 ? Math.round(transferQty * (b.dailySales / totalTargetSales)) : perBranch
      steps.push(`Везти ${fmt(portion)} шт. в ${shortBranch(b.name)}`)
    })
    if (riskyBranch) steps.push(`В ${shortBranch(riskyBranch.name)} не везти — там запас на ${riskyBranch.daysOfCover} дн., не успеют продать`)
    recs.push({ id: 'transfer', severity: 'blue', icon: <ArrowRightLeft className="h-4 w-4" />, badgeLabel: 'Нет движения', title: 'Товар не продаётся', headline: `${fmt(transferQty)} шт. простаивают в ${noSalesBranches.length > 1 ? noSalesBranches.length + ' филиалах' : shortBranch(noSalesBranches[0].name)}`, tableHeaders: ['Филиал', 'Продаж/день', 'Остаток'], tableRows, analysis: analysisParts.join(' '), steps })
  }

  if (expiryRiskBranches.length > 0) {
    const atRiskQty  = expiryRiskBranches.reduce((s, b) => s + b.stock, 0)
    const atRiskLoss = atRiskQty * item.costPrice
    const minExpiry  = Math.min(...expiryRiskBranches.map(r => r.expiryDays))
    const fastBranches = branches.filter(b => b.dailySales >= 1 && !expiryRiskBranches.includes(b)).sort((a, b) => b.dailySales - a.dailySales).slice(0, 2)
    const canSellInTime = fastBranches.reduce((s, b) => s + Math.round(b.dailySales * minExpiry), 0)
    const tableRows = expiryRiskBranches.map(b => [shortBranch(b.name), `${b.expiryDays} дн.`, `${fmt(b.stock)} шт.`] as [string, string, string])
    const totalCanSell = expiryRiskBranches.reduce((s, b) => s + Math.round(b.dailySales * b.expiryDays), 0)
    const totalWillExpire = Math.max(0, atRiskQty - totalCanSell)
    const expiryAnalysis = totalWillExpire > 0
      ? `При текущем темпе продадут ${fmt(totalCanSell)} шт. — остальные ${fmt(totalWillExpire)} шт. уйдут в списание. Действовать нужно сейчас.`
      : `Продать должны успеть, но запас на пределе. Если спрос чуть упадёт — часть товара просрочится.`
    const steps: string[] = []
    if (fastBranches.length > 0 && canSellInTime >= atRiskQty * 0.6) {
      const totalFastSales = fastBranches.reduce((s, b) => s + b.dailySales, 0)
      fastBranches.forEach(b => {
        const canTake = totalFastSales > 0 ? Math.round(atRiskQty * (b.dailySales / totalFastSales)) : Math.round(atRiskQty / fastBranches.length)
        steps.push(`Срочно перевезти ${fmt(canTake)} шт. в ${shortBranch(b.name)}`)
      })
    } else {
      steps.push(`Предложить ~${fmt(Math.round(atRiskQty * 0.5))} шт. оптом соседней аптеке`)
      steps.push(`Сделать скидку 20–25% — ускорить продажи пока не поздно`)
    }
    steps.push(`Новый заказ не делать до полной продажи текущего остатка`)
    recs.push({ id: 'expiry', severity: 'orange', icon: <AlertTriangle className="h-4 w-4" />, badgeLabel: 'Срок годности', title: 'Срок годности истекает', headline: `через ${minExpiry} дн. — ${fmt(atRiskQty)} шт.`, tableHeaders: ['Филиал', 'До просрочки', 'Остаток'], tableRows, analysis: expiryAnalysis, loss: `${fmt(atRiskLoss)} сум`, steps })
  }

  if (item.status === 'dead' || (networkDailySales < 0.5 && item.stock > 0)) {
    const minExpiry    = Math.min(...branches.map(b => b.expiryDays))
    const canSell      = networkDailySales > 0 ? Math.round(networkDailySales * minExpiry) : 0
    const willExpire   = Math.max(0, item.stock - canSell)
    const expireLoss   = willExpire * item.costPrice
    const monthsToSell = networkDailySales > 0 ? (item.stock / networkDailySales / 30).toFixed(1) : '∞'
    const tableRows = branches.map(b => [shortBranch(b.name), `${b.dailySales.toFixed(1)} шт./день`, b.daysOfCover < 999 ? `${b.daysOfCover} дн.` : '—'] as [string, string, string])
    const analysis = networkDailySales > 0
      ? `Весь остаток уйдёт за ~${monthsToSell} мес., а срок истекает через ${minExpiry} дн.${willExpire > 0 ? ` ${fmt(willExpire)} шт. просрочатся.` : ''}`
      : `Ни в одном филиале продаж нет. Весь остаток — ${fmt(item.stock)} шт. — просрочится через ${minExpiry} дн.`
    const steps = [`Предложить ${fmt(Math.round(item.stock * 0.4))}–${fmt(Math.round(item.stock * 0.5))} шт. оптом соседней аптеке`, `Сделать скидку 15–25% — нужно ускорить продажи`, `Исключить из плана закупок до роста спроса`]
    recs.push({ id: 'dead_network', severity: 'red', icon: <TrendingDown className="h-4 w-4" />, badgeLabel: 'Не продаётся', title: 'Слабые продажи по всей сети', headline: `${networkDailySales.toFixed(1)} шт./день — реализация займёт ~${monthsToSell} мес.`, tableHeaders: ['Филиал', 'Продаж/день', 'Запас'], tableRows, analysis, loss: willExpire > 0 ? `${fmt(expireLoss)} сум` : undefined, steps })
  }

  if (item.status === 'oos' || item.status === 'critical') {
    const surplus = branches.filter(b => b.daysOfCover > 60).sort((a, b) => b.stock - a.stock)
    const tableRows = (surplus.length > 0 ? surplus : branches).map(b => [shortBranch(b.name), b.daysOfCover < 999 ? `${b.daysOfCover} дн.` : '—', `${fmt(b.stock)} шт.`] as [string, string, string])
    let analysis = ''
    if (item.status === 'oos') {
      analysis = surplus.length > 0
        ? `Каждый день без товара — ${fmt(item.lostRevenuePerDay)} сум потерянной выручки. В ${surplus.map(b => shortBranch(b.name)).join(' и ')} есть свободный запас — можно перевезти.`
        : `Каждый день без товара — ${fmt(item.lostRevenuePerDay)} сум потерянной выручки. Запасов в других точках нет — нужен срочный заказ.`
    } else {
      analysis = surplus.length > 0
        ? `Запаса хватит на ${Math.round(item.daysOfCover)} дн. — пора пополнять. В ${surplus.map(b => shortBranch(b.name)).join(' и ')} запас с излишком, можно взять оттуда.`
        : `Запаса хватит на ${Math.round(item.daysOfCover)} дн. Пополнить нужно до того, как закончится.`
    }
    const steps: string[] = []
    if (surplus.length > 0) {
      surplus.forEach(b => { steps.push(`Перевезти ${fmt(Math.round(b.stock * 0.4))} шт. из ${shortBranch(b.name)}`) })
    } else {
      steps.push(`Сделать срочный заказ у поставщика — ${fmt(item.recommendedQty)} шт.`)
    }
    steps.push(`Добавить в ближайший заказ поставщику`)
    recs.push({ id: 'oos', severity: 'red', icon: <CartIcon className="h-4 w-4" />, badgeLabel: item.status === 'oos' ? 'Нет в наличии' : 'Критично мало', title: item.status === 'oos' ? 'Товара нет в наличии' : 'Запас на исходе', headline: item.status === 'oos' ? `потери ${fmt(item.lostRevenuePerDay)} сум каждый день` : `хватит на ${Math.round(item.daysOfCover)} дн. при ${item.avgDailySales.toFixed(1)} шт./день`, tableHeaders: surplus.length > 0 ? ['Филиал (излишки)', 'Запас', 'Остаток'] : ['Филиал', 'Запас', 'Остаток'], tableRows, analysis, steps })
  }

  return recs
}
