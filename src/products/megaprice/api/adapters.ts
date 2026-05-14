import type { DrugSearchRow, PriceOffer } from '@/shared/api/types'
import type { DistributorRef } from '@/products/megaprice/api/hooks'
import type {
  Distributor,
  Medicine,
  PaymentOption,
  SupplierOffer,
} from '@/products/megaprice/pages/purchase/types/purchase.types'

/**
 * Один drug может вернуться из поиска несколькими строками — по одной на
 * каждого producerName. UI ждёт уникальный `id`, поэтому делаем составной ключ.
 * Ключ стабилен между страницами и перерисовками — selection/favorite держатся.
 *
 * `drugId` сохраняется отдельно — он нужен для последующего GET
 * /api/drugsearch/search/by-drug-id/{drugId}.
 */
export interface MedicineWithDrugId extends Medicine {
  drugId: number
}

/** МНН пустой или явное «no mnn» от бэка — UI должен его скрыть. */
function cleanMnn(raw: string | null | undefined): string {
  const v = (raw ?? '').trim()
  if (!v) return ''
  if (v.toLowerCase() === 'no mnn') return ''
  return v
}

/** Бэк хранит названия производителей в lowercase ("инфаприм"). UI ждёт Title Case. */
function titleCase(raw: string | null | undefined): string {
  const v = (raw ?? '').trim()
  if (!v) return ''
  return v.replace(/\b([\p{L}])/gu, (m) => m.toLocaleUpperCase())
}

export function mapDrugRowToMedicine(row: DrugSearchRow): MedicineWithDrugId {
  const manufacturer = titleCase(row.producerName)
  const country = (row.countryName ?? '').trim()
  return {
    drugId: row.id,
    // Стабильный ключ: один drug × один producer = одна строка на любой странице.
    id: `${row.id}::${manufacturer || '_'}`,
    name: row.fullName,
    mnn: cleanMnn(row.inn),
    manufacturer,
    country,
    isFavorite: false,
  }
}

// ── Offer mapping ────────────────────────────────────────────────────

const MOCK_PAYMENT: PaymentOption[] = [
  { percentage: 100, days: 0, label: 'Предоплата 100%' },
]

function pickContact(): { contactType: 'telegram' | 'email'; contact: string } {
  return { contactType: 'email', contact: '' }
}

/** DistributorRef (бэк) → Distributor (UI). cityName подставляется в WholesalersView через regions. */
export function mapDistributorRefToDistributor(d: DistributorRef, cityName?: string | null): Distributor {
  return {
    id: String(d.id),
    name: d.name,
    city: cityName ?? d.regionName ?? '',
    lastPriceDate: d.lastPriceDate ?? '',
    contactType: 'email',
    contact: '',
  }
}

/** PriceOffer (item прайса) → пара {medicine, offer} для DistributorProducts. */
export function mapPriceOfferToProduct(o: PriceOffer): { medicine: Medicine; offer: SupplierOffer } {
  const distributor: Distributor = {
    id: String(o.distributorId),
    name: o.distributorName ?? `Distr ${o.distributorId}`,
    city: o.regionName ?? '',
    lastPriceDate: o.foundDate ?? '',
    contactType: 'email',
    contact: '',
  }
  const offer: SupplierOffer = {
    id: String(o.id),
    medicineId: String(o.drugId),
    distributor,
    expiryDate: o.expireDate ?? o.expireDateStr ?? '',
    paymentTypes: MOCK_PAYMENT,
    priceWithVat: Number(o.price ?? 0),
    originalPrice:
      o.discountedPrice != null && o.discountedPrice < Number(o.price)
        ? Number(o.price)
        : undefined,
  }
  // Имя/производитель/страна для UI берём из price-row (бэк уже их обогатил).
  const manuf = (o.producerName ?? '').trim()
  const medicine: Medicine = {
    id: `${o.drugId}::${manuf || '_'}`,
    drugId: o.drugId,
    name: o.drugName ?? `Drug ${o.drugId}`,
    mnn: '',
    manufacturer: manuf.replace(/\b([\p{L}])/gu, (m) => m.toLocaleUpperCase()),
    country: '',
    isFavorite: false,
  }
  return { medicine, offer }
}

export function mapPriceOfferToSupplierOffer(o: PriceOffer): SupplierOffer {
  const distributor: Distributor = {
    id: String(o.distributorId),
    name: o.distributorName ?? `Дистрибьютор ${o.distributorId}`,
    city: o.regionName ?? '',
    lastPriceDate: o.foundDate ?? '',
    ...pickContact(),
  }

  // Бэк не возвращает medicineId — это поле в SupplierOffer служит «к какому
  // препарату относится оффер». На странице это всегда выбранный drugId.
  // Здесь подставляем `${o.drugId}` чтобы UI продолжал работать.
  return {
    id: String(o.id),
    medicineId: String(o.drugId),
    distributor,
    expiryDate: o.expireDate ?? o.expireDateStr ?? '',
    paymentTypes: MOCK_PAYMENT,
    priceWithVat: Number(o.price ?? 0),
    originalPrice:
      o.discountedPrice != null && o.discountedPrice < Number(o.price)
        ? Number(o.price)
        : undefined,
  }
}
