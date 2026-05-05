// Данные из POS-системы аптеки
// stock   — текущий остаток в аптеке
// needed  — потребуется (нужно дозаказать, рассчитано POS)
// excess  — лишний (слишком много на остатке, рассчитано POS)
// lastSale — дата последней продажи

export interface POSMedicine {
  id: string          // совпадает с Medicine.id из mockMedicines
  barcode: string
  stock: number
  needed: number
  excess: number
  lastSale: string    // ISO date
}

// ph1 — Аптека №1 "Здоровье", Алматы
const ph1: POSMedicine[] = [
  { id: 'm1',  barcode: '7613032088101', stock: 4,  needed: 8,  excess: 0,  lastSale: '2026-04-26' },
  { id: 'm2',  barcode: '4607051791046', stock: 0,  needed: 12, excess: 0,  lastSale: '2026-04-25' },
  { id: 'm3',  barcode: '7613034156884', stock: 2,  needed: 6,  excess: 0,  lastSale: '2026-04-24' },
  { id: 'm4',  barcode: '5000157021219', stock: 8,  needed: 0,  excess: 0,  lastSale: '2026-04-27' },
  { id: 'm5',  barcode: '4606664003534', stock: 1,  needed: 15, excess: 0,  lastSale: '2026-04-27' },
  { id: 'm6',  barcode: '3838989522124', stock: 3,  needed: 9,  excess: 0,  lastSale: '2026-04-23' },
  { id: 'm7',  barcode: '5000456019095', stock: 5,  needed: 5,  excess: 0,  lastSale: '2026-04-26' },
  { id: 'm8',  barcode: '3838989638015', stock: 0,  needed: 10, excess: 0,  lastSale: '2026-04-22' },
  { id: 'm9',  barcode: '4607009397478', stock: 12, needed: 0,  excess: 5,  lastSale: '2026-04-27' },
  { id: 'm10', barcode: '3838989638022', stock: 7,  needed: 3,  excess: 0,  lastSale: '2026-04-25' },
  { id: 'm11', barcode: '4028760303077', stock: 14, needed: 0,  excess: 8,  lastSale: '2026-04-26' },
  { id: 'm12', barcode: '3838989602183', stock: 0,  needed: 20, excess: 0,  lastSale: '2026-04-24' },
  { id: 'm13', barcode: '8906056460104', stock: 9,  needed: 0,  excess: 0,  lastSale: '2026-04-27' },
  { id: 'm14', barcode: '3401040440803', stock: 6,  needed: 4,  excess: 0,  lastSale: '2026-04-26' },
  { id: 'm15', barcode: '4820027921147', stock: 0,  needed: 7,  excess: 0,  lastSale: '2026-04-20' },
]

// ph2 — Аптека "Фармация", Астана
const ph2: POSMedicine[] = [
  { id: 'm1',  barcode: '7613032088101', stock: 11, needed: 0,  excess: 4,  lastSale: '2026-04-27' },
  { id: 'm2',  barcode: '4607051791046', stock: 3,  needed: 5,  excess: 0,  lastSale: '2026-04-26' },
  { id: 'm4',  barcode: '5000157021219', stock: 0,  needed: 18, excess: 0,  lastSale: '2026-04-25' },
  { id: 'm5',  barcode: '4606664003534', stock: 6,  needed: 0,  excess: 0,  lastSale: '2026-04-27' },
  { id: 'm6',  barcode: '3838989522124', stock: 0,  needed: 14, excess: 0,  lastSale: '2026-04-24' },
  { id: 'm7',  barcode: '5000456019095', stock: 2,  needed: 8,  excess: 0,  lastSale: '2026-04-27' },
  { id: 'm9',  barcode: '4607009397478', stock: 5,  needed: 0,  excess: 0,  lastSale: '2026-04-26' },
  { id: 'm10', barcode: '3838989638022', stock: 0,  needed: 11, excess: 0,  lastSale: '2026-04-23' },
  { id: 'm11', barcode: '4028760303077', stock: 20, needed: 0,  excess: 12, lastSale: '2026-04-27' },
  { id: 'm12', barcode: '3838989602183', stock: 4,  needed: 6,  excess: 0,  lastSale: '2026-04-25' },
  { id: 'm13', barcode: '8906056460104', stock: 0,  needed: 9,  excess: 0,  lastSale: '2026-04-22' },
  { id: 'm14', barcode: '3401040440803', stock: 8,  needed: 0,  excess: 2,  lastSale: '2026-04-27' },
  { id: 'm16', barcode: '4820027921148', stock: 3,  needed: 7,  excess: 0,  lastSale: '2026-04-26' },
  { id: 'm17', barcode: '4820027921149', stock: 0,  needed: 15, excess: 0,  lastSale: '2026-04-24' },
  { id: 'm18', barcode: '4820027921150', stock: 7,  needed: 0,  excess: 3,  lastSale: '2026-04-27' },
]

// ph3 — Аптека "Жизнь", Алматы
const ph3: POSMedicine[] = [
  { id: 'm2',  barcode: '4607051791046', stock: 8,  needed: 0,  excess: 2,  lastSale: '2026-04-27' },
  { id: 'm3',  barcode: '7613034156884', stock: 0,  needed: 10, excess: 0,  lastSale: '2026-04-26' },
  { id: 'm5',  barcode: '4606664003534', stock: 4,  needed: 6,  excess: 0,  lastSale: '2026-04-25' },
  { id: 'm6',  barcode: '3838989522124', stock: 15, needed: 0,  excess: 7,  lastSale: '2026-04-27' },
  { id: 'm7',  barcode: '5000456019095', stock: 0,  needed: 12, excess: 0,  lastSale: '2026-04-23' },
  { id: 'm8',  barcode: '3838989638015', stock: 6,  needed: 4,  excess: 0,  lastSale: '2026-04-27' },
  { id: 'm10', barcode: '3838989638022', stock: 2,  needed: 8,  excess: 0,  lastSale: '2026-04-26' },
  { id: 'm12', barcode: '3838989602183', stock: 9,  needed: 0,  excess: 0,  lastSale: '2026-04-27' },
  { id: 'm13', barcode: '8906056460104', stock: 0,  needed: 16, excess: 0,  lastSale: '2026-04-25' },
  { id: 'm14', barcode: '3401040440803', stock: 3,  needed: 7,  excess: 0,  lastSale: '2026-04-24' },
  { id: 'm15', barcode: '4820027921147', stock: 11, needed: 0,  excess: 5,  lastSale: '2026-04-27' },
  { id: 'm16', barcode: '4820027921148', stock: 0,  needed: 13, excess: 0,  lastSale: '2026-04-22' },
  { id: 'm17', barcode: '4820027921149', stock: 5,  needed: 0,  excess: 0,  lastSale: '2026-04-27' },
]

export const mockPOSByPharmacy: Record<string, POSMedicine[]> = {
  ph1,
  ph2,
  ph3,
}

// Оставляем для обратной совместимости (ph1 по умолчанию)
export const mockPOSMedicines = ph1

export const mockPOSSyncTime = '2026-04-27T09:15:00'
