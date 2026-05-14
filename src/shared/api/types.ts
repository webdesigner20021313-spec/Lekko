// DTO-зеркало бэкенда ABU. См. ABU.Auth.Application/DTOs/* и ABU.DrugSearch.Application/DTOs/*.

export interface AuthUser {
  id: number
  login: string
  fullName: string | null
  email: string | null
  phone: string | null
  drugStoreId: number | null
  companyId: number | null
  dsRoleId: number | null
  userType: 'client' | 'manager'
  roles: string[]
}

export interface DrugStoreInfo {
  drugStoreId: number
  drugStoreName: string | null
  companyId: number | null
  companyName: string | null
  address: string | null
  phone: string | null
  email: string | null
  areaId: number | null
  regionId: number | null
  appLang: string | null
  distributorId: number | null
}

export interface LicenseInfo {
  statusCode: number
  expireDate: string | null
  daysRemains: number
  blockReason: string | null
  previlegyType: number
  isDistributor: boolean
  distributorId: number | null
  isExpired: boolean
}

export interface MeResponse {
  user: AuthUser
  drugStore: DrugStoreInfo | null
  license: LicenseInfo | null
}

export interface LicenseExpiredError {
  licenseExpired: true
  paynetId: string
  blockReason: string
  daysRemains: string
}

// ── DrugSearch ────────────────────────────────────────────────────────────

export interface SearchCreateRequest {
  drugStoreId: number
  drugName: string
  countryId?: number | null
  substanceId?: number | null
  showProducers?: boolean
}

/**
 * Drug-row в результате /api/drugsearch/search.
 * 1:1 с DrugResponse (ABU.DrugSearch.Application/DTOs/ReferenceResponseDtos.cs:73).
 * Один drug может вернуться несколько раз — по одной строке на каждого producerName.
 */
export interface DrugSearchRow {
  id: number              // drug_id
  fullName: string
  tradeMarkId?: number
  formId?: number | null
  doza?: string | null
  quantity?: number
  statusId?: number
  groupId?: number | null
  /** МНН — действующие вещества через запятую. */
  inn: string
  producerName?: string | null
  countryName?: string | null
  producerCount?: number
}

/** Substance (МНН). GET /api/drugsearch/reference/substances. */
export interface SubstanceRef {
  id: number
  name: string
}

/** Производитель. GET /api/drugsearch/reference/producers. */
export interface ProducerRef {
  id: number
  name: string
  countryId?: number | null
  countryName?: string | null
}

/** Бэкенд возвращает PagedResult<T> с этими полями. */
export interface PagedResponse<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

/** Цена-офер дистрибьютора (/search/by-drug-id/{id}). */
export interface PriceOffer {
  id: number
  itemId?: number
  drugId: number
  drugName?: string
  distributorId: number
  distributorName?: string
  producerId?: number | null
  producerName?: string | null
  price: number
  priceBase?: number | null
  priceType?: string | null
  expireDate?: string | null
  expireDateStr?: string | null
  origPack?: string | null
  regionId?: number | null
  regionName?: string | null
  isFavorite?: boolean
  discountPercent?: number | null
  discountedPrice?: number | null
  isExcluded?: boolean
  foundDate?: string
}

// ── Cart ──────────────────────────────────────────────────────────────────

export interface CartItem {
  id: number
  orderId: number
  variantId: number
  purchaseId: number
  drugId: number
  drugName: string | null
  quantity: number
  priceId: number | null
  /** id позиции в прайс-листе дистра (offer.id из /by-drug-id). */
  itemId: number | null
  price: number
  producerId: number | null
  producerName: string | null
  distributorId: number
  distributorName: string | null
}

export interface CartResponse {
  items: CartItem[]
  count: number
  lineCount: number
  total: number
}

export interface AddCartItemDto {
  drugStoreId: number
  drugId: number
  distributorId: number
  priceId?: number | null
  /** id позиции в прайс-листе дистра (передаётся из offer.id). */
  itemId?: number | null
  price: number
  producerId?: number | null
  quantity?: number
}
