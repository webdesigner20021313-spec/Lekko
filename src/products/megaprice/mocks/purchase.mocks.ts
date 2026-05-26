import type { Pharmacy, Medicine, SupplierOffer } from '@/products/megaprice/pages/purchase/types/purchase.types'
import { mockPOSMedicines } from '@/products/megaprice/mocks/pos.mocks'

export const mockPharmacies: Pharmacy[] = [
  {
    id: 'ph1',
    name: 'Аптека №1 "Здоровье"',
    address: 'ул. Абая, 12',
    city: 'Алматы',
  },
  {
    id: 'ph2',
    name: 'Аптека "Фармация"',
    address: 'пр. Республики, 45',
    city: 'Астана',
  },
  {
    id: 'ph3',
    name: 'Аптека "Жизнь"',
    address: 'ул. Сейфуллина, 78',
    city: 'Алматы',
  },
]

export const mockMedicines: Medicine[] = [
  { id: 'm1',  name: 'Вольтарен Эмульгель гель 1% туба 100 г №1',        mnn: 'Диклофенак',                        mnnLatin: 'Diclofenac',                    manufacturer: 'Novartis',         country: 'Швейцария',      isFavorite: true  },
  { id: 'm2',  name: 'Отривин кап. назал. 0,05% фл.-капельн. 10 мл №1',  mnn: 'Ксилометазолин',                    mnnLatin: 'Xylometazoline',                manufacturer: 'Novartis',         country: 'Швейцария',      isFavorite: false },
  { id: 'm3',  name: 'Синекод сироп фл. 200 мл №1',                       mnn: 'Бутамират',                         mnnLatin: 'Butamirate',                    manufacturer: 'Novartis',         country: 'Швейцария',      isFavorite: false },
  { id: 'm4',  name: 'Нурофен для детей сусп. апельсин 200 мл №1',        mnn: 'Ибупрофен',                         mnnLatin: 'Ibuprofen',                     manufacturer: 'Reckitt Benckiser', country: 'Великобритания', isFavorite: true  },
  { id: 'm5',  name: 'Парацетамол табл. 500 мг №20',                      mnn: 'Парацетамол',                       mnnLatin: 'Paracetamol',                   manufacturer: 'Биосинтез',        country: 'Россия',         isFavorite: false },
  { id: 'm6',  name: 'Амоксициллин капс. 500 мг №16',                     mnn: 'Амоксициллин',                      mnnLatin: 'Amoxicillin',                   manufacturer: 'KRKA',             country: 'Словения',       isFavorite: false },
  { id: 'm7',  name: 'Аугментин табл. п/о 875 мг+125 мг №14',             mnn: 'Амоксициллин+Клавулановая к-та',    mnnLatin: 'Amoxicillin+Clavulanic acid',   manufacturer: 'GlaxoSmithKline',  country: 'Великобритания', isFavorite: true  },
  { id: 'm8',  name: 'Пантопразол табл. 40 мг №28',                       mnn: 'Пантопразол',                       mnnLatin: 'Pantoprazole',                  manufacturer: 'Teva',             country: 'Израиль',        isFavorite: false },
  { id: 'm9',  name: 'Лоратадин табл. 10 мг №10',                         mnn: 'Лоратадин',                         mnnLatin: 'Loratadine',                    manufacturer: 'Акрихин',          country: 'Россия',         isFavorite: false },
  { id: 'm10', name: 'Цетиризин табл. п/о блистер №30',                   mnn: 'Цетиризин',                         mnnLatin: 'Cetirizine',                    manufacturer: 'KRKA',             country: 'Словения',       isFavorite: false },
  { id: 'm11', name: 'Бисопролол табл. 5 мг №30',                         mnn: 'Бисопролол',                        mnnLatin: 'Bisoprolol',                    manufacturer: 'Berlin-Chemie',    country: 'Германия',       isFavorite: false },
  { id: 'm12', name: 'Метформин табл. п/п/о 500 мг №60',                  mnn: 'Метформин',                         mnnLatin: 'Metformin',                     manufacturer: 'Teva',             country: 'Израиль',        isFavorite: false },
  { id: 'm13', name: 'Омез капс. кишечнораств. 20 мг №30',                mnn: 'Омепразол',                         mnnLatin: 'Omeprazole',                    manufacturer: "Dr. Reddy's",      country: 'Индия',          isFavorite: true  },
  { id: 'm14', name: 'Но-шпа табл. 40 мг №100',                           mnn: 'Дротаверин',                        mnnLatin: 'Drotaverine',                   manufacturer: 'Sanofi',           country: 'Франция',        isFavorite: false },
  { id: 'm15', name: 'Актовегин р-р д/ин. 40 мг/мл амп. 5 мл №5',        mnn: 'Депротеинизированный гемодериват',  mnnLatin: 'Deproteinized hemodialysate',   manufacturer: 'Takeda',           country: 'Австрия',        isFavorite: false },
  { id: 'm16', name: 'Мексидол р-р д/ин. 50 мг/мл амп. 2 мл №10',        mnn: 'Этилметилгидроксипиридина сукцинат', mnnLatin: 'Ethylmethylhydroxypyridine succinate', manufacturer: 'Фармасофт', country: 'Россия',        isFavorite: false },
  { id: 'm17', name: 'Эналаприл табл. 10 мг №20',                         mnn: 'Эналаприл',                         mnnLatin: 'Enalapril',                     manufacturer: 'KRKA',             country: 'Словения',       isFavorite: false },
  { id: 'm18', name: 'Ибупрофен табл. п/о 400 мг №50',                    mnn: 'Ибупрофен',                         mnnLatin: 'Ibuprofen',                     manufacturer: 'Биосинтез',        country: 'Россия',         isFavorite: false },
]

export const mockDistributors = [
  { id: 'd1',  name: 'Katren',      city: 'Ташкент',   lastPriceDate: '2026-05-26', contactType: 'telegram' as const, contact: '@katren_uz'       },
  { id: 'd2',  name: 'Protek',      city: 'Ташкент',   lastPriceDate: '2026-05-26', contactType: 'telegram' as const, contact: '@protek_uz'       },
  { id: 'd3',  name: 'UzbekFarm',   city: 'Самарканд', lastPriceDate: '2026-04-17', contactType: 'email'    as const, contact: 'uzb@pharmopt.uz'  },
  { id: 'd4',  name: 'Arnika',      city: 'Ташкент',   lastPriceDate: '2026-05-26', contactType: 'telegram' as const, contact: '@arnika_tash'     },
  { id: 'd5',  name: 'BioFarm',     city: 'Ташкент',   lastPriceDate: '2026-04-16', contactType: 'email'    as const, contact: 'bio@biofarm.uz'   },
  { id: 'd6',  name: 'MedOpt',      city: 'Нукус',     lastPriceDate: '2026-04-14', contactType: 'telegram' as const, contact: '@medopt_nukus'    },
  { id: 'd7',  name: 'Dori-Darmon', city: 'Ташкент',   lastPriceDate: '2026-04-19', contactType: 'telegram' as const, contact: '@doridarmon_uz'   },
  { id: 'd8',  name: 'Farmservis',  city: 'Ташкент',   lastPriceDate: '2026-04-18', contactType: 'telegram' as const, contact: '@farmservis_bot'  },
  { id: 'd9',  name: 'Tajmed',      city: 'Душанбе',   lastPriceDate: '2026-04-15', contactType: 'telegram' as const, contact: '@tajmed_orders'   },
  { id: 'd10', name: 'Alfa Pharma', city: 'Самарканд', lastPriceDate: '2026-04-13', contactType: 'email'    as const, contact: 'info@alfapharma.uz'},
]

const distributors = mockDistributors

// Шорткаты для вариантов оплаты
const p100  = { percentage: 100, days: null, label: '100% предоплата'  }
const p50d14 = { percentage: 50,  days: 14,  label: '50% / 14 дней'   }
const p30d30 = { percentage: 30,  days: 30,  label: '30% / 30 дней'   }
const pContr = { percentage: null,days: null, label: 'Договорная'      }
const p0d45  = { percentage: 0,   days: 45,  label: '0% / 45 дней'    }
const p20d60 = { percentage: 20,  days: 60,  label: '20% / 60 дней'   }

export const mockSupplierOffers: SupplierOffer[] = [
  // Вольтарен (m1)
  { id: 'o1',  medicineId: 'm1', distributor: distributors[0], expiryDate: '2026-08-15', paymentTypes: [p100, p50d14],         priceWithVat: 4500,                       bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o2',  medicineId: 'm1', distributor: distributors[1], expiryDate: '2025-12-20', paymentTypes: [p50d14, p30d30],       priceWithVat: 4200, originalPrice: 4700,   bonus: { type: 'discount',      label: 'Скидка 10%'      } },
  { id: 'o3',  medicineId: 'm1', distributor: distributors[2], expiryDate: '2026-03-10', paymentTypes: [pContr],               priceWithVat: 3900,                       bonus: { type: 'free_delivery', label: 'Беспл. доставка' } },
  { id: 'o3b', medicineId: 'm1', distributor: distributors[3],  expiryDate: '2026-06-01', paymentTypes: [p30d30, p0d45],  priceWithVat: 4100,                       bonus: { type: 'gift',          label: '+Товар'          } },
  { id: 'o3e', medicineId: 'm1', distributor: distributors[0],  expiryDate: '2026-10-15', paymentTypes: [p100, p50d14],   priceWithVat: 4250,                       bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o3f', medicineId: 'm1', distributor: distributors[1],  expiryDate: '2026-07-20', paymentTypes: [p30d30],         priceWithVat: 4050, originalPrice: 4400,   bonus: { type: 'discount',      label: 'Скидка %'        } },
  { id: 'o3g', medicineId: 'm1', distributor: distributors[2],  expiryDate: '2026-11-01', paymentTypes: [pContr],         priceWithVat: 3850,                       bonus: { type: 'free_delivery', label: 'Беспл. доставка' } },
  { id: 'o3h', medicineId: 'm1', distributor: distributors[3],  expiryDate: '2026-04-30', paymentTypes: [p50d14, p0d45],  priceWithVat: 4600,                                                                                  },
  { id: 'o3i', medicineId: 'm1', distributor: distributors[4],  expiryDate: '2025-12-10', paymentTypes: [p20d60],         priceWithVat: 4150,                       bonus: { type: 'gift',          label: '+Товар'          } },
  { id: 'o3j', medicineId: 'm1', distributor: distributors[5],  expiryDate: '2026-09-05', paymentTypes: [p100],           priceWithVat: 3980,                                                                                  },
  { id: 'o3k', medicineId: 'm1', distributor: distributors[6],  expiryDate: '2026-05-15', paymentTypes: [p50d14, p30d30], priceWithVat: 4320,                       bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o3l', medicineId: 'm1', distributor: distributors[7],  expiryDate: '2026-12-20', paymentTypes: [pContr],         priceWithVat: 4450,                       bonus: { type: 'discount',      label: 'Скидка 5%'       } },
  { id: 'o3m', medicineId: 'm1', distributor: distributors[2],  expiryDate: '2026-08-25', paymentTypes: [p30d30, p20d60], priceWithVat: 4190,                       bonus: { type: 'free_delivery', label: 'Беспл. доставка' } },
  { id: 'o3c', medicineId: 'm1', distributor: distributors[8], expiryDate: '2026-09-20', paymentTypes: [p100],                 priceWithVat: 4800,                                                                                  },
  { id: 'o3d', medicineId: 'm1', distributor: distributors[5], expiryDate: '2025-11-05', paymentTypes: [p50d14, p20d60],       priceWithVat: 4350,                       bonus: { type: 'discount',      label: 'Скидка %'        } },

  // Отривин (m2)
  { id: 'o4',  medicineId: 'm2', distributor: distributors[0], expiryDate: '2026-06-30', paymentTypes: [p100, p50d14],         priceWithVat: 1800,                       bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o5',  medicineId: 'm2', distributor: distributors[3], expiryDate: '2026-01-15', paymentTypes: [p30d30],               priceWithVat: 1650,                                                                                  },
  { id: 'o6',  medicineId: 'm2', distributor: distributors[9], expiryDate: '2025-09-20', paymentTypes: [p50d14, p30d30],       priceWithVat: 1750, originalPrice: 1900,   bonus: { type: 'discount',      label: 'Скидка %'        } },

  // Синекод (m3)
  { id: 'o7',  medicineId: 'm3', distributor: distributors[1], expiryDate: '2026-10-01', paymentTypes: [p100, p0d45],          priceWithVat: 2300,                       bonus: { type: 'free_delivery', label: 'Беспл. доставка' } },
  { id: 'o8',  medicineId: 'm3', distributor: distributors[4], expiryDate: '2026-04-15', paymentTypes: [pContr],               priceWithVat: 2100,                                                                                  },

  // Нурофен (m4)
  { id: 'o9',  medicineId: 'm4', distributor: distributors[0], expiryDate: '2026-12-31', paymentTypes: [p100, p50d14, p30d30], priceWithVat: 1200,                       bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o10', medicineId: 'm4', distributor: distributors[2], expiryDate: '2025-08-10', paymentTypes: [p50d14],               priceWithVat: 1050, originalPrice: 1200,   bonus: { type: 'discount',      label: 'Скидка 10%'      } },
  { id: 'o11', medicineId: 'm4', distributor: distributors[5], expiryDate: '2026-05-20', paymentTypes: [p30d30, p20d60],       priceWithVat: 1100,                       bonus: { type: 'gift',          label: '+Товар'          } },

  // Парацетамол (m5)
  { id: 'o12', medicineId: 'm5', distributor: distributors[3], expiryDate: '2026-09-01', paymentTypes: [p100],                 priceWithVat: 500,                                                                                   },
  { id: 'o13', medicineId: 'm5', distributor: distributors[5], expiryDate: '2026-06-15', paymentTypes: [pContr],               priceWithVat: 480,                        bonus: { type: 'cashback',      label: 'Кэшбэк'          } },

  // Амоксициллин (m6)
  { id: 'o14', medicineId: 'm6', distributor: distributors[6], expiryDate: '2026-11-20', paymentTypes: [p100, p50d14],         priceWithVat: 3200,                       bonus: { type: 'free_delivery', label: 'Беспл. доставка' } },
  { id: 'o15', medicineId: 'm6', distributor: distributors[1], expiryDate: '2025-10-05', paymentTypes: [p50d14, p30d30],       priceWithVat: 2900, originalPrice: 3100,   bonus: { type: 'discount',      label: 'Скидка %'        } },
  { id: 'o16', medicineId: 'm6', distributor: distributors[8], expiryDate: '2026-07-30', paymentTypes: [p30d30],               priceWithVat: 3100,                                                                                  },

  // Аугментин (m7)
  { id: 'o17', medicineId: 'm7', distributor: distributors[0], expiryDate: '2026-08-01', paymentTypes: [p100, p50d14, p0d45],  priceWithVat: 7500,                       bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o18', medicineId: 'm7', distributor: distributors[2], expiryDate: '2026-02-28', paymentTypes: [pContr],               priceWithVat: 7200, originalPrice: 7800,   bonus: { type: 'discount',      label: 'Скидка 10%'      } },
  { id: 'o19', medicineId: 'm7', distributor: distributors[9], expiryDate: '2025-11-10', paymentTypes: [p50d14],               priceWithVat: 7800,                       bonus: { type: 'gift',          label: '+Товар'          } },

  // Пантопразол (m8)
  { id: 'o20', medicineId: 'm8', distributor: distributors[7], expiryDate: '2026-04-20', paymentTypes: [p100],                 priceWithVat: 2600,                                                                                  },
  { id: 'o21', medicineId: 'm8', distributor: distributors[3], expiryDate: '2026-09-15', paymentTypes: [p30d30, p20d60],       priceWithVat: 2400,                       bonus: { type: 'cashback',      label: 'Кэшбэк'          } },

  // Лоратадин (m9)
  { id: 'o22', medicineId: 'm9', distributor: distributors[0], expiryDate: '2026-12-01', paymentTypes: [p100, p50d14],         priceWithVat: 850,                        bonus: { type: 'free_delivery', label: 'Беспл. доставка' } },
  { id: 'o23', medicineId: 'm9', distributor: distributors[4], expiryDate: '2025-07-30', paymentTypes: [pContr],               priceWithVat: 780,                                                                                   },

  // Цетиризин (m10)
  { id: 'o24', medicineId: 'm10', distributor: distributors[2], expiryDate: '2026-10-10', paymentTypes: [p100, p30d30],        priceWithVat: 920,                        bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o25', medicineId: 'm10', distributor: distributors[5], expiryDate: '2026-05-05', paymentTypes: [p50d14],              priceWithVat: 880,                                                                                   },
  { id: 'o26', medicineId: 'm10', distributor: distributors[6], expiryDate: '2025-12-20', paymentTypes: [p30d30, p0d45],       priceWithVat: 900, originalPrice: 980,     bonus: { type: 'discount',      label: 'Скидка %'        } },

  // Бисопролол (m11)
  { id: 'o27', medicineId: 'm11', distributor: distributors[1], expiryDate: '2026-07-15', paymentTypes: [p100, p50d14],        priceWithVat: 1500,                       bonus: { type: 'gift',          label: '+Товар'          } },
  { id: 'o28', medicineId: 'm11', distributor: distributors[3], expiryDate: '2026-03-25', paymentTypes: [pContr],              priceWithVat: 1380,                                                                                  },

  // Метформин (m12)
  { id: 'o29', medicineId: 'm12', distributor: distributors[0], expiryDate: '2026-11-01', paymentTypes: [p100, p50d14, p30d30],priceWithVat: 1100,                       bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o30', medicineId: 'm12', distributor: distributors[5], expiryDate: '2026-06-20', paymentTypes: [p50d14, p20d60],      priceWithVat: 980,                        bonus: { type: 'free_delivery', label: 'Беспл. доставка' } },
  { id: 'o31', medicineId: 'm12', distributor: distributors[2], expiryDate: '2025-09-10', paymentTypes: [p30d30],              priceWithVat: 1050, originalPrice: 1150,   bonus: { type: 'discount',      label: 'Скидка 10%'      } },

  // Омез (m13)
  { id: 'o32', medicineId: 'm13', distributor: distributors[8], expiryDate: '2026-08-30', paymentTypes: [p100, p0d45],         priceWithVat: 1700,                       bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o33', medicineId: 'm13', distributor: distributors[1], expiryDate: '2026-02-10', paymentTypes: [pContr],              priceWithVat: 1580,                       bonus: { type: 'gift',          label: '+Товар'          } },

  // Но-шпа (m14)
  { id: 'o34', medicineId: 'm14', distributor: distributors[0], expiryDate: '2027-01-15', paymentTypes: [p100, p50d14],        priceWithVat: 2200,                       bonus: { type: 'free_delivery', label: 'Беспл. доставка' } },
  { id: 'o35', medicineId: 'm14', distributor: distributors[3], expiryDate: '2026-09-20', paymentTypes: [p50d14, p30d30],      priceWithVat: 2050,                                                                                  },
  { id: 'o36', medicineId: 'm14', distributor: distributors[9], expiryDate: '2025-11-30', paymentTypes: [p30d30, p20d60],      priceWithVat: 2150, originalPrice: 2300,   bonus: { type: 'discount',      label: 'Скидка %'        } },

  // Актовегин (m15)
  { id: 'o37', medicineId: 'm15', distributor: distributors[6], expiryDate: '2026-10-05', paymentTypes: [p100, p50d14, p0d45], priceWithVat: 12000,                      bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o38', medicineId: 'm15', distributor: distributors[2], expiryDate: '2026-06-10', paymentTypes: [pContr],              priceWithVat: 11500, originalPrice: 12500, bonus: { type: 'discount',      label: 'Скидка 10%'      } },

  // Мексидол (m16)
  { id: 'o39', medicineId: 'm16', distributor: distributors[7], expiryDate: '2026-12-15', paymentTypes: [p100, p30d30],        priceWithVat: 8500,                       bonus: { type: 'cashback',      label: 'Кэшбэк'          } },
  { id: 'o40', medicineId: 'm16', distributor: distributors[4], expiryDate: '2025-08-20', paymentTypes: [p50d14, p20d60],      priceWithVat: 8200, originalPrice: 8800,   bonus: { type: 'discount',      label: 'Скидка %'        } },
  { id: 'o41', medicineId: 'm16', distributor: distributors[5], expiryDate: '2026-04-01', paymentTypes: [p30d30],              priceWithVat: 8800,                       bonus: { type: 'gift',          label: '+Товар'          } },

  // Эналаприл (m17)
  { id: 'o42', medicineId: 'm17', distributor: distributors[3], expiryDate: '2026-09-25', paymentTypes: [p100],                priceWithVat: 680,                                                                                   },
  { id: 'o43', medicineId: 'm17', distributor: distributors[0], expiryDate: '2026-05-15', paymentTypes: [pContr],              priceWithVat: 620,                        bonus: { type: 'cashback',      label: 'Кэшбэк'          } },

  // Ибупрофен (m18)
  { id: 'o44', medicineId: 'm18', distributor: distributors[5], expiryDate: '2026-11-10', paymentTypes: [p100, p50d14],        priceWithVat: 750,                        bonus: { type: 'free_delivery', label: 'Беспл. доставка' } },
  { id: 'o45', medicineId: 'm18', distributor: distributors[1], expiryDate: '2026-07-20', paymentTypes: [p50d14],              priceWithVat: 700,                                                                                   },
  { id: 'o46', medicineId: 'm18', distributor: distributors[2], expiryDate: '2025-10-15', paymentTypes: [p30d30, p0d45],       priceWithVat: 720, originalPrice: 800,     bonus: { type: 'discount',      label: 'Скидка 10%'      } },
]

// POS items — medicines that need restocking
const posMap = Object.fromEntries(mockPOSMedicines.map(p => [p.id, p]))
export const mockPosItems: Medicine[] = mockMedicines
  .filter(m => ['m1', 'm4', 'm5', 'm7', 'm9', 'm13', 'm14', 'm18'].includes(m.id))
  .map(m => ({ ...m, stock: posMap[m.id]?.stock, needed: posMap[m.id]?.needed }))
