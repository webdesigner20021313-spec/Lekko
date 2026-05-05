# Platform — Монорепо Lekko

Один кодовый проект деплоится на несколько доменов. Режим определяется по `window.location.hostname` в `src/config/mode.ts`.

| Домен | Режим | Продукт |
|-------|-------|---------|
| platform.lekko.com | portal | Все продукты + Users |
| megaprice.com | standalone | Megaprice |
| apteka.com | standalone | Apteka |
| analytic.com | standalone | Analytic |

## Структура

```
src/
├── shared/
│   ├── ui-kit/        ← UI Kit "Isomorphic FuryRoad" (Button, Input, Select, Card, Badge, Table, Modal, Toast)
│   ├── auth/          ← LoginPage, ForgotPasswordPage, PrivateRoute, useAuthStore
│   ├── api/
│   ├── hooks/
│   ├── utils/
│   └── stores/        ← useUserStore, useNotificationStore
├── layouts/           ← PortalLayout, StandaloneLayout
├── components/        ← Header (лого+поиск+уведомления+профиль), Sidebar, ProfileBlock
├── pages/             ← Dashboard, Users/ (только портал)
├── products/
│   ├── megaprice/     ← purchase, need, cart, orders, wholesalers (все готовы)
│   ├── apteka/        ← пусто, позже
│   └── analytic/      ← пусто, позже
├── assets/logos/      ← lekko/megaprice/apteka/analytic-logo.svg (текстовые заглушки)
├── config/            ← mode.ts, products.ts
├── App.tsx
└── main.tsx
```

## Sidebar

**Portal mode:** категории = продукты, подкатегории = разделы (`/megaprice/purchase`, `/megaprice/need`...)  
**Standalone mode:** разделы продукта становятся категориями (`/purchase`, `/need`...)

## Auth

- Регистрации нет — аккаунты создаёт админ в разделе Users
- `/login` на каждом домене, backend проверяет доступ роли к продукту
- Токен хранится отдельно на каждом домене (сессии независимы)
- Раздел Users — только на portal, не на доменах продуктов

## Tech Stack

React 19 + Vite + TypeScript + React Router v7 + Zustand + Tailwind CSS + Radix UI + lucide-react + recharts + xlsx

## Правила разработки

**Где что лежит:**
- Общий код → `src/shared/`
- UI Kit → `src/shared/ui-kit/` (не дублировать, не создавать заново)
- Страницы портала → `src/pages/`
- Код продукта → `src/products/{name}/`

**Запреты:**
- Не импортировать код одного продукта в другой
- Не писать backend код
- Не делать страницу регистрации
- Не брать UI Kit из внешних источников — только из Megaprice

**Импорты** — всегда через `@/`:
```
@/shared/ui-kit/Button
@/shared/auth/useAuthStore
@/products/megaprice/components/...
@/config/mode
```

## Лого

Header выбирает лого через `mode.ts` → `products.ts`. Сейчас текстовые заглушки в `src/assets/logos/`, позже заменить SVG из Figma. Лого используется в Header и на странице логина.
