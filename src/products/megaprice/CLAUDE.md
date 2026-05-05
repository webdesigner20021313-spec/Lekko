# Megaprice — продукт платформы Lekko

## 📌 Что это

Megaprice — система заказов медикаментов для аптек: единый каталог товаров от
оптовиков, сравнение цен, корзина, оформление заказов.

Продукт работает в двух режимах (см. корневой `CLAUDE.md`):
- **Standalone** — на `megaprice.com`, без sidebar портала, разделы доступны по
  путям `/purchase`, `/need`, `/cart`, `/orders`, `/wholesalers`.
- **Portal** — внутри `platform.lekko.com`, под префиксом `/megaprice/*`.

Маршруты собираются один раз в `routes.tsx` и переиспользуются в обоих режимах.

## 📂 Структура

```
src/products/megaprice/
├── CLAUDE.md           ← этот файл
├── routes.tsx          ← <Route> элементы продукта (см. выше)
├── pages/
│   ├── purchase/       ← Магазин (полностью работает)
│   ├── need/           ← Потребность (полностью работает)
│   ├── cart/           ← Корзинка (полностью работает)
│   ├── orders/         ← Заказы (полностью работает)
│   └── wholesalers/    ← Оптовики/дистрибуторы (полностью работает)
├── stores/
│   ├── useOrdersStore.ts
│   └── useWholesalersStore.ts
└── mocks/
    ├── purchase.mocks.ts
    ├── need.mocks.ts
    ├── orders.mocks.ts
    ├── pos.mocks.ts
    ├── wholesalers.mocks.ts
    └── demoCart.ts
```

## 🛠️ Правила

- Использовать UI Kit ТОЛЬКО из `@/shared/ui-kit/*`. Не дублировать.
- Общие стор/утилиты — из `@/shared/*`. Auth — из `@/shared/auth/*`.
- НИКОГДА не импортировать код из других продуктов (`@/products/apteka`, `@/products/analytic`).
- Бизнес-логика разделов изолирована внутри `pages/<section>/`.

См. корневой `CLAUDE.md` для общих правил платформы.
