export interface Wholesaler {
  id:              string
  name:            string
  city:            string
  phone:           string
  telegram:        string | null
  inn:             string
  minOrderSum:     number
  deliveryDays:    number
  categories:      string[]
  discountPercent: number | null
  isActive:        boolean
}

export const mockWholesalers: Wholesaler[] = [
  {
    id: 'w1', name: 'Katren', city: 'Ташкент',
    phone: '+998 71 200-11-22', telegram: '@katren_uz',
    inn: '302847561', minOrderSum: 500000, deliveryDays: 2,
    categories: ['Антибиотики', 'Витамины', 'Обезболивающие'],
    discountPercent: 7, isActive: true,
  },
  {
    id: 'w2', name: 'Protek', city: 'Ташкент',
    phone: '+998 71 233-44-55', telegram: '@protek_uz',
    inn: '201938472', minOrderSum: 300000, deliveryDays: 1,
    categories: ['Кардиология', 'Диабет', 'Неврология'],
    discountPercent: null, isActive: true,
  },
  {
    id: 'w3', name: 'UzbekFarm', city: 'Самарканд',
    phone: '+998 66 230-77-88', telegram: null,
    inn: '402731845', minOrderSum: 200000, deliveryDays: 3,
    categories: ['Витамины', 'БАД', 'Косметика'],
    discountPercent: 5, isActive: true,
  },
  {
    id: 'w4', name: 'Arnika', city: 'Ташкент',
    phone: '+998 71 244-66-77', telegram: '@arnika_tash',
    inn: '301928476', minOrderSum: 400000, deliveryDays: 2,
    categories: ['Антибиотики', 'Противовирусные', 'ЖКТ'],
    discountPercent: null, isActive: true,
  },
  {
    id: 'w5', name: 'BioFarm', city: 'Ташкент',
    phone: '+998 71 255-88-99', telegram: '@biofarm_uz',
    inn: '203847162', minOrderSum: 600000, deliveryDays: 2,
    categories: ['Онкология', 'Иммунология', 'Редкие'],
    discountPercent: 3, isActive: true,
  },
  {
    id: 'w6', name: 'MedOpt', city: 'Нукус',
    phone: '+998 61 222-33-44', telegram: '@medopt_nukus',
    inn: '501827364', minOrderSum: 150000, deliveryDays: 5,
    categories: ['Общие', 'Витамины', 'Перевязочные'],
    discountPercent: null, isActive: true,
  },
  {
    id: 'w7', name: 'Dori-Darmon', city: 'Ташкент',
    phone: '+998 71 207-33-11', telegram: '@doridarmon_uz',
    inn: '305628471', minOrderSum: 350000, deliveryDays: 1,
    categories: ['Антибиотики', 'Кардиология', 'Обезболивающие'],
    discountPercent: null, isActive: true,
  },
  {
    id: 'w8', name: 'Farmservis', city: 'Ташкент',
    phone: '+998 71 268-44-00', telegram: '@farmservis_bot',
    inn: '204719382', minOrderSum: 250000, deliveryDays: 2,
    categories: ['Диабет', 'Гормоны', 'ЖКТ'],
    discountPercent: 4, isActive: true,
  },
  {
    id: 'w9', name: 'Tajmed', city: 'Душанбе',
    phone: '+992 37 221-55-66', telegram: '@tajmed_orders',
    inn: '602847391', minOrderSum: 450000, deliveryDays: 4,
    categories: ['Противовирусные', 'Витамины', 'Неврология'],
    discountPercent: null, isActive: true,
  },
  {
    id: 'w10', name: 'Alfa Pharma', city: 'Самарканд',
    phone: '+998 66 233-77-55', telegram: null,
    inn: '403827164', minOrderSum: 300000, deliveryDays: 3,
    categories: ['Онкология', 'Антибиотики', 'Редкие'],
    discountPercent: 6, isActive: true,
  },
]
