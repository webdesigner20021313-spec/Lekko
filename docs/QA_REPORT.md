# LekkoPharm — Frontend QA Report

**Дата прогона**: 2026-05-08
**Тестировщик**: Claude (автоматизированный прогон через `mcp__Claude_Preview`)
**Цель**: проверить готовность фронтенда к подключению backend API.
**Версия после QA**: `v1.0.6`

---

## TL;DR

✅ Все основные flow на мобиле и десктопе проходят.
✅ Login / logout / 3 mock-юзера / wrong creds работают.
✅ Theme + language toggle работают.
✅ Mode switch (standalone ↔ portal) работает.
🔧 Найдено 2 бага — оба исправлены в этом проходе.
📋 Подготовлен список **17 точек интеграции** mock → REST API (раздел 4).

---

## 1. Карта маршрутов

### Standalone mode (`megaprice.com`)
| Path | Component | Auth |
|------|-----------|------|
| `/login` | `LoginPage` | public |
| `/purchase` | `PurchasePage` | private |
| `/need` | `NeedPage` | private |
| `/cart` | `CartPage` | private |
| `/orders` | `OrderHistoryPage` | private |
| `/orders/:id` | `OrderDetailPage` | private |
| `/wholesalers` | `WholesalersPage` | private |
| `*` | redirect → `/purchase` | — |

### Portal mode (`platform.lekko.com`)
| Path | Component | Auth |
|------|-----------|------|
| `/login` | `LoginPage` | public |
| `/` | `Dashboard` | private |
| `/megaprice/{purchase\|need\|cart\|orders\|orders/:id\|wholesalers}` | (те же) | private |
| `/users`, `/users/roles` | Users management | private |
| `/analytic`, `/apteka` | "В разработке" | private |

---

## 2. Найденные баги (исправлены в `v1.0.6`)

### 🔴 BUG-1: Header показывает захардкоженного юзера, не текущего залогиненного

**Симптом**: после login как Manager (`manager@megaprice.uz`) header всё равно показывает `АК Алишер Каримов Администратор`.

**Причина**: `src/components/Header/index.tsx` читал `user` из `useUserStore` (который захардкожен на `mockUser` = админ), а не из `useAuthStore` (куда `login()` пишет реального юзера).

**Воспроизведение**:
1. Logout
2. Login с `manager@megaprice.uz` / `Manager2026`
3. localStorage `megaprice-auth.state.user.name` = "Зафар Рахимов" ✅
4. Но header.avatar = "АК" 🔴

**Фикс**: Header теперь подписан на `useAuthStore.user`. `useUserStore` остался для prefs/POS-интеграции.

```tsx
// Было
const { user } = useUserStore()
// Стало
const authUser = useAuthStore((s) => s.user)
const user = authUser ?? { name: '', email: '', role: '', avatar: '' }
```

**Файл**: `src/components/Header/index.tsx`

---

### 🔴 BUG-2: В portal mode после login редирект ведёт на 404 → catchall на `/`

**Симптом**: пользователь логинится в portal mode, ожидает попасть на dashboard `/`, но `LoginPage` хардкодит редирект на `/purchase`. В portal mode `/purchase` не существует (правильный путь — `/megaprice/purchase`), сработал catchall и пользователь оказывался на `/` с лишним redirect step.

**Причина**: захардкоженный default landing path в `LoginPage`:
```tsx
const from = !rawFrom || rawFrom === '/' ? '/purchase' : rawFrom
```

**Фикс**: дефолтный landing зависит от mode:
```tsx
const defaultLanding = appMode.mode === 'portal' ? '/' : '/purchase'
const from = !rawFrom || rawFrom === '/login' ? defaultLanding : rawFrom
```

**Файл**: `src/shared/auth/LoginPage.tsx`

---

## 3. Результаты прогона по экранам

Легенда: 🟢 OK, 🟡 работает но с замечанием, 🔴 сломано

### Standalone mode @ mobile (375×812)

| Экран | Статус | Что проверено |
|-------|--------|---------------|
| `/login` | 🟢 | поля логин/пароль, ошибка на wrong creds, forgot-password modal открывается |
| `/purchase` (manual) | 🟢 | search input, filter button → bottom sheet (`<BottomSheet>`), 18 карточек лекарств, тап → master-detail с back button, 15 supplier-карточек с qty controls |
| `/purchase` (Pos) | 🟢 | 30 POS-карточек, фавориты, остаток/потребность |
| `/purchase` (Excel) | 🟢 | drop zone, кнопка «Выбрать файл» |
| `/purchase` (Дистрибуторы) | 🟢 | 10 карточек дистрибуторов, тап → 9 продуктов карточками |
| `/need` | 🟢 | 47 карточек со status-stripe + 4-stat grid (Остаток / Дни / Прод/д / Нужно), filter sheet, AI advice modal full-screen, drawer full-screen |
| `/cart` | 🟢 | карточки сгруппированы по дистрибутору, чекбоксы, sticky-bar `[Итого · N → ↑]` над таб-баром, тап → BottomSheet с инвойсом + аптекой + «Создать заказ» |
| Создание заказа | 🟢 | success-modal с номером (например `ЗАК-70324`), новый заказ появляется в `/orders` |
| `/orders` | 🟢 | 21 карточка (20 mock + 1 созданный), status pills фильтр, filter button → BottomSheet (calendar + статусы) |
| `/orders/:id` | 🟢 | header (компактный шрифт + icon-only Excel/Invoice), info cards, distributor groups, items как карточки, action bar `[Отменить][Завершить]` над таб-баром |
| `/wholesalers` | 🟢 | 10 карточек с tap-to-call (`tel:`) и tap-to-telegram (`https://t.me/`), discount modal bottom-anchored |

### Standalone mode @ desktop (1280×800)

| Экран | Статус | Замечание |
|-------|--------|-----------|
| `/purchase` | 🟢 | таблица medicines, side panel supplier offers, 4-tab header, sidebar |
| `/cart` | 🟢 | таблица слева + 360px invoice panel справа, sticky-bar скрыт |
| `/orders` | 🟢 | 4 KPI cards в ряд, таблица, фильтры inline (search + date range + Excel) |
| `/need` | 🟢 | таблица 47 строк, sortable/resizable columns, 4 KPI |
| `/wholesalers` | 🟢 | 10 строк таблицы с 8 колонками |

### Portal mode

| Экран | Статус |
|-------|--------|
| `/` | 🟢 (Dashboard with product cards) |
| `/megaprice/cart` | 🟢 (тот же CartPage с 21 группами) |

### Auth flows

| Тест | Результат |
|------|-----------|
| Wrong creds | 🟢 показано «Неверный логин или пароль», остаёмся на `/login` |
| `admin@megaprice.uz` / `Mega2026` | 🟢 → header `АК Алишер Каримов Администратор` |
| `manager@megaprice.uz` / `Manager2026` | 🟢 → header `ЗР Зафар Рахимов Менеджер` |
| `operator@megaprice.uz` / `Operator2026` | 🟢 → header `БТ Бобур Тошматов Оператор` |
| Logout | 🟢 → редирект на `/login` |
| Forgot password modal | 🟢 открывается, поле телефон + кнопка «Получить код» |

### Common controls

| Контрол | Результат |
|---------|-----------|
| Theme toggle (Sun/Moon) | 🟢 light ↔ dark, persists в localStorage |
| Language toggle (RU/UZ) | 🟢 переключает все строки sidebar/header (проверено: «Прайс-лист» → «Narxlar ro'yxati») |
| Mode switch dev-toggle | 🟢 переключает Portal ↔ Megaprice standalone, рестарт SPA |
| Mobile tab bar | 🟢 5 пунктов: Прайс-лист / Потребность / Корзинка / Заказы / Дистрибуторы — все navigate корректно |
| Notifications dropdown (header) | 🟢 список читается, mark-all-read работает |
| Sidebar поиск (desktop) | 🟢 по 5 разделам |

---

## 4. Mock-данные → API integration map

> Это карта точек, где сейчас mock-данные, и где нужно подставить реальные REST endpoints.

### 4.1 Auth

| Файл | Что делает | Заменить на |
|------|------------|-------------|
| `src/shared/auth/useAuthStore.ts:18-49` | hardcoded `MOCK_USERS` (admin / manager / operator) | `POST /api/auth/login` → `{ token, user }` |
| `src/shared/auth/useAuthStore.ts:57-65` | `login(login, pwd)` сравнивает с MOCK_USERS | `POST /api/auth/login`, сохранять `token` в storage |
| `src/shared/auth/useAuthStore.ts:68` | `logout()` локально | `POST /api/auth/logout` + clear token |
| `src/shared/auth/LoginPage.tsx:15` | `MOCK_CODE='123456'` для forgot-password | `POST /api/auth/forgot-password { phone }` → `POST /api/auth/verify-code { phone, code }` |

### 4.2 Каталог / справочники

| Mock | Файл импортирующий | Endpoint |
|------|--------------------|----------|
| `mockMedicines` | `purchase/PurchasePage`, `need/NeedPage` | `GET /api/medicines` |
| `mockSupplierOffers` | `purchase/components/SupplierOffers/SupplierOffers.tsx`, `DistributorProducts.tsx` | `GET /api/medicines/:id/offers` или `GET /api/offers?medicineId=` |
| `mockDistributors` | `purchase/components/WholesalersView.tsx`, `DistributorProducts.tsx` | `GET /api/distributors` |
| `mockPharmacies` | `cart/CartPage.tsx`, `purchase/PharmacySelector.tsx` | `GET /api/pharmacies` (юзера-аптеки) |
| `mockPosItems` | `purchase/components/Post/PostMedicineList.tsx` | `GET /api/pos/items` (POS-интеграция) |
| `mockNeedItems` | `need/NeedPage.tsx` | `GET /api/inventory/needs?period=30d&pharmacyIds=` |
| `mockWholesalers` | `wholesalers/WholesalersPage.tsx` | `GET /api/wholesalers` |

### 4.3 Корзина / заказы

| Действие | Файл / функция | Endpoint |
|----------|---------------|----------|
| Add to cart | `purchase/hooks/usePurchaseCart.ts` `addItem()` | (опционально) `POST /api/cart/items` или держать локально |
| Create order | `cart/CartPage.tsx:285-318` `createOrder()` | `POST /api/orders` body=`{ pharmacyId, groups: [{ distributorId, items: [...] }] }` → `{ id, number, ... }` |
| Cancel order | `orders/OrderDetailPage.tsx:697-704` | `PUT /api/orders/:id/status { status: 'cancelled' }` |
| Complete order | `orders/OrderDetailPage.tsx` (handleComplete) | `PUT /api/orders/:id/status { status: 'completed' }` |
| Accept proposal | `orders/OrderDetailPage.tsx:629-668` `handleAcceptProposal(distributorId)` | `POST /api/orders/:id/groups/:distributorId/accept-proposal` |
| Reject proposal | `orders/OrderDetailPage.tsx:671-688` `handleRejectProposal(distributorId)` | `POST /api/orders/:id/groups/:distributorId/reject-proposal` |
| Orders list | `useOrdersStore` mock-init | `GET /api/orders?status=&dateFrom=&dateTo=&search=` |
| Order detail | `useOrdersStore.find()` | `GET /api/orders/:id` |

### 4.4 Дистрибуторы / скидки

| Действие | Файл / функция | Endpoint |
|----------|---------------|----------|
| Set discount | `wholesalers/WholesalersPage.tsx:171-177` `handleSave()` → `setDiscount(name, %)` | `PUT /api/wholesalers/:id/discount { percent: number\|null }` |
| Get discounts | `useWholesalersStore` (хранит локально по name) | `GET /api/wholesalers/discounts` |

### 4.5 Excel импорт

| Действие | Файл | Endpoint |
|----------|------|----------|
| Парсинг XLSX | `purchase/components/MedicineList/ExcelUploadView.tsx` | парсится клиентом через xlsx; не требует backend |
| Сохранение списка | сейчас локально | (опционально) `POST /api/cart/import-list` |

### 4.6 Auto-select

| Действие | Файл | Endpoint |
|----------|------|----------|
| Авто-подбор поставщика | `purchase/components/AutoSelect/AutoSelectModal.tsx` | алгоритм клиентский (по mockSupplierOffers); сервер может предложить `POST /api/cart/auto-select` |

### 4.7 Notifications

| Mock | Файл | Endpoint |
|------|------|----------|
| `useNotificationStore` | `src/shared/stores/useNotificationStore.ts` | `GET /api/notifications`, WebSocket для пушей, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` |

---

## 5. Что готово к подключению API без переделки

- ✅ Все pages читают данные из stores или mock-импортов — точка замены чёткая
- ✅ Все формы вызывают понятные handler-функции (`createOrder`, `handleAccept`, `setDiscount`)
- ✅ Все модалки имеют `onConfirm`/`onSave` колбэки
- ✅ Auth abstraction готов — нужно подменить `login()` тело на fetch
- ✅ Token persistence уже работает через Zustand persist middleware (имя ключа `megaprice-auth`)
- ✅ TypeScript типы для всех data shapes определены (`Order`, `Medicine`, `SupplierOffer`, `Distributor`, `NeedItem`, `CartItem`)

---

## 6. Что нужно добавить под backend

1. **HTTP клиент**: создать `src/shared/api/client.ts` с базовым `fetch` wrapper, токен из `useAuthStore`, обработкой 401 → logout.
2. **Loading / error states**: пока что mock-данные доступны мгновенно; реальный API даст delays и failures. Добавить:
   - skeleton loaders на тех же страницах (`PurchasePage`, `NeedPage`, `OrderHistoryPage`)
   - error boundary + toast при сетевых ошибках
3. **Optimistic updates** для cart/order actions — сейчас они мгновенные, при API нужно либо ждать ответа (с loading state), либо optimistic + rollback.
4. **WebSocket / polling** для уведомлений и proposal-обновлений в `OrderDetailPage`.
5. **Pagination** для `/orders` и `/need` — сейчас mock возвращает все целиком.
6. **Rate limiting на запросы фильтров** — debounce search input (`onSearch`).

---

## 7. Mock-юзеры для тестов

| Login | Password | Имя | Роль | Avatar |
|-------|----------|-----|------|--------|
| `admin@megaprice.uz` | `Mega2026` | Алишер Каримов | Администратор | АК |
| `manager@megaprice.uz` | `Manager2026` | Зафар Рахимов | Менеджер | ЗР |
| `operator@megaprice.uz` | `Operator2026` | Бобур Тошматов | Оператор | БТ |

Forgot-password код для теста: **`123456`** (`MOCK_CODE` в `LoginPage.tsx:15`).

---

## 8. Файлы изменённые этим QA

```
src/components/Header/index.tsx        — фикс BUG-1 (user из useAuthStore)
src/shared/auth/LoginPage.tsx           — фикс BUG-2 (mode-aware redirect)
docs/QA_REPORT.md                       — этот файл
```

Build: `1,324.21 kB │ gzip: 368.72 kB` — без регрессии.
