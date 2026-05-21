/**
 * Хуки Megaprice — все backend-вызовы продукта.
 *
 * Каждый — тонкая обёртка над useQueryApiClient (единственный примитив).
 * Возвращают { data, isLoading, isSuccess, isError, refetch, appendData }.
 *  - GET: стартует на mount, пагинация/фильтры через `params`.
 *  - не-GET: `disableOnMount: true`, триггер вручную через `appendData`.
 *
 * Раньше это был один файл (~1000 строк). Разнесён по доменам; этот barrel
 * сохраняет публичный путь импорта `@/products/megaprice/api/hooks`.
 */
export * from './search'
export * from './references'
export * from './cart'
export * from './account'
export * from './autoselect'
export * from './favorites'
export * from './enrichment'
export * from './discounts'
export * from './orders'
export * from './purchases'
export * from './distributorOrders'
