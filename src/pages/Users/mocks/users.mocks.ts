import type { Role, User, Pharmacy } from '@/pages/Users/types/users.types'

export const MOCK_PHARMACIES: Pharmacy[] = [
  { id: 'ph-1',  name: 'Аптека Здоровье',    address: 'ул. Навои, 15, Ташкент'          },
  { id: 'ph-2',  name: 'Аптека Фарм Плюс',   address: 'пр. Амира Темура, 23, Ташкент'   },
  { id: 'ph-3',  name: 'Аптека Vita',         address: 'ул. Мустакиллик, 7, Ташкент'     },
  { id: 'ph-4',  name: 'Аптека №4',           address: 'пр. Бунёдкор, 45, Ташкент'       },
  { id: 'ph-5',  name: 'Аптека Медикал',      address: 'ул. Шота Руставели, 12, Ташкент' },
  { id: 'ph-6',  name: 'Аптека Доктор',       address: 'ул. Алмазар, 34, Ташкент'        },
  { id: 'ph-7',  name: 'Аптека Саломатлик',   address: 'ул. Чилонзор, 8, Ташкент'        },
  { id: 'ph-8',  name: 'Аптека Ёшлик',        address: 'пр. Юнусабад, 17, Ташкент'       },
  { id: 'ph-9',  name: 'Аптека Нур',          address: 'ул. Регистон, 3, Самарканд'      },
  { id: 'ph-10', name: 'Аптека Барака',       address: 'ул. Ипаксарой, 22, Бухара'       },
]

export const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: 'Администратор',
    projects: {
      megaprice: {
        enabled: true,
        sections: {
          shop:        { enabled: true, view: true, edit: true, delete: true },
          needs:       { enabled: true, view: true, edit: true, delete: true },
          cart:        { enabled: true, view: true, edit: true, delete: true },
          orders:      { enabled: true, view: true, edit: true, delete: true },
          wholesalers: { enabled: true, view: true, edit: true, delete: true },
        },
      },
      users: {
        enabled: true,
        sections: {
          'users-list': { enabled: true, view: true, edit: true, delete: true },
          roles:        { enabled: true, view: true, edit: true, delete: true },
        },
      },
    },
    portalSections: {},
  },
  {
    id: 'role-2',
    name: 'Менеджер',
    projects: {
      megaprice: {
        enabled: true,
        sections: {
          shop:        { enabled: true, view: true, edit: true,  delete: false },
          needs:       { enabled: true, view: true, edit: false, delete: false },
          cart:        { enabled: true, view: true, edit: true,  delete: false },
          orders:      { enabled: true, view: true, edit: false, delete: false },
          wholesalers: { enabled: true, view: true, edit: false, delete: false },
        },
      },
    },
    portalSections: {},
  },
  {
    id: 'role-3',
    name: 'Аналитик',
    projects: {
      megaprice: {
        enabled: true,
        sections: {
          needs: { enabled: true, view: true, edit: false, delete: false },
        },
      },
      analytic: {
        enabled: true,
        sections: {},
      },
    },
    portalSections: {},
  },
  {
    id: 'role-4',
    name: 'Оператор',
    projects: {
      megaprice: {
        enabled: true,
        sections: {
          shop:   { enabled: true, view: true, edit: true,  delete: false },
          orders: { enabled: true, view: true, edit: false, delete: false },
        },
      },
    },
    portalSections: {},
  },
]

export const mockUsers: User[] = [
  { id: 'u-1', name: 'Алишер Каримов',   phone: '+998 90 000 11 01', email: 'alisher@lekko.uz',  login: 'alisher.karimov',   password: '123456', roleId: 'role-1', isActive: true,  createdAt: '2026-01-10T09:00:00', pharmacyAccess: { all: true,  ids: [] } },
  { id: 'u-2', name: 'Зафар Рахимов',    phone: '+998 90 123 45 67', email: 'zafar@lekko.uz',    login: 'zafar.rahimov',     password: '123456', roleId: 'role-2', isActive: true,  createdAt: '2026-02-15T10:30:00', pharmacyAccess: { all: false, ids: ['ph-1', 'ph-3'] } },
  { id: 'u-3', name: 'Дилноза Усманова', phone: '+998 91 234 56 78', email: 'dilnoza@lekko.uz',  login: 'dilnoza.usmanova',  password: '123456', roleId: 'role-3', isActive: true,  createdAt: '2026-02-20T11:00:00', pharmacyAccess: { all: true,  ids: [] } },
  { id: 'u-4', name: 'Бобур Тошматов',   phone: '+998 93 345 67 89', email: undefined,            login: 'bobur.toshmatov',   password: '123456', roleId: 'role-4', isActive: false, createdAt: '2026-03-01T08:00:00', pharmacyAccess: { all: false, ids: ['ph-2', 'ph-5', 'ph-7'] } },
  { id: 'u-5', name: 'Нилуфар Хасанова', phone: '+998 94 456 78 90', email: 'nilufar@lekko.uz',  login: 'nilufar.hasanova',  password: '123456', roleId: 'role-2', isActive: true,  createdAt: '2026-03-10T14:00:00', pharmacyAccess: { all: false, ids: ['ph-1'] } },
]
