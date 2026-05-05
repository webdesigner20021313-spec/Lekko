# MegaPrice — Design Style Guide
> Основан на Isomorphic FuryRoad (https://isomorphic-furyroad.vercel.app/)
> Этот файл — единственный источник правды по стилю. Не нужно возвращаться на сайт.

---

## Layout

### Структура экрана
```
┌──────┬──────────────────────────────────────────┐
│ 72px │ 280px (раскрытый)  │  Контент             │
│ Икон │ Навигация          │  Header (64px)        │
│ сайд │ (белый фон)        │  Page content         │
│ бар  │                    │                       │
└──────┴────────────────────┴───────────────────────┘
```
- Узкий сайдбар: `72px`, тёмный фон
- Широкая панель навигации: `280px`, белый фон — открывается поверх или рядом
- Хедер: `height: 64px`, белый фон, `border-bottom: 1px solid #E5E7EB`
- Контент: отступ `px-6 py-6`, фон страницы `#FFFFFF` (bg-white)

---

## Цвета

### Основная палитра
```
Текст основной:      #111827  (gray-900)
Текст вторичный:     #6B7280  (gray-500)
Текст подсказка:     #9CA3AF  (gray-400)
Фон страницы:        #FFFFFF  (white)
Фон карточки:        #FFFFFF
Фон таблицы (thead): #F9FAFB  (gray-50)
Разделители:         #E5E7EB  (gray-200)
Разделители тонкие:  #F3F4F6  (gray-100)
```

### Кнопки
```
Primary (Добавить, Сохранить):  bg=#111827 (black)  text=white  hover=#000000
Secondary (Экспорт, Отмена):    bg=#FFFFFF           border=#E5E7EB  text=#374151
Danger (Удалить):               bg=#EF4444  text=white
```

### Сайдбар узкий (иконки)
```
Фон:               #1C1917  (stone-900, тёмно-коричнево-чёрный)
Иконка активная:   белый фон (rounded-xl), белая иконка
Иконка неактивная: #78716C  (stone-500)
Иконка hover:      #D6D3D1  (stone-300)
Версия внизу:      #57534E  (stone-600)
```

### Сайдбар широкий (навигация)
```
Фон:                #FFFFFF
Группа (label):     #9CA3AF  (gray-400), text-xs uppercase
Пункт активный:     bg=#F4F4F5  (zinc-100), text=#111827, border-left 2px #111827
Пункт hover:        bg=#F9FAFB
Пункт неактивный:   text=#374151
```

### Статус-бейджи
```
completed / success:  bg=#D1FAE5  text=#065F46  (зелёный)
pending:              bg=#FEF3C7  text=#92400E  (жёлтый/оранжевый)
cancelled / error:    bg=#FEE2E2  text=#991B1B  (красный)
draft / default:      bg=#F3F4F6  text=#374151  (серый)
refunded / info:      bg=#DBEAFE  text=#1E40AF  (синий)
```

### Акцент (ссылки, прогрессбар, активные состояния)
```
Primary accent:  #3872FA  (синий)  — используется в breadcrumbs, links, progress
```

---

## Типографика

### Шрифты
```
Body / UI:    Inter (font-inter)
Headings:     Inter (тот же, font-bold/semibold)
Нет Lexend Deca — только Inter везде
```

### Размеры
```
Page title (h1):     22–24px  font-bold    color=#111827
Section title (h2):  18–20px  font-semibold
Card title:          16px     font-semibold  color=#111827
Body text:           14px     font-normal    color=#374151
Secondary text:      13px     font-normal    color=#6B7280
Caption / meta:      12px     font-normal    color=#9CA3AF
Table header:        12px     font-semibold  color=#6B7280  uppercase или normal
Badge text:          12px     font-medium
Button text:         14px     font-semibold
```

---

## Компоненты

### Кнопки
```
Height:         40px (h-10) — стандарт  |  36px (h-9) — компактная
Padding:        px-4 (16px)
Border-radius:  rounded-lg (8px)
Font:           14px font-semibold
Gap иконка:     gap-2 (8px)
Transition:     transition-all duration-200

Primary:   bg-gray-900 text-white hover:bg-black                     (чёрная)
Secondary: bg-white border border-gray-300 text-gray-700 hover:bg-gray-50
Outline:   border border-gray-300 text-gray-700 bg-transparent
Danger:    bg-red-500 text-white hover:bg-red-600
Ghost:     text-gray-600 hover:bg-gray-100 border-0
```

### Поля ввода (Input)
```
Height:         40px (h-10)
Padding:        px-3
Border:         1px solid #E5E7EB (border-gray-200)
Border-radius:  rounded-lg (8px)
Font size:      14px
Color:          #111827
Placeholder:    #9CA3AF
Focus:          ring-2 ring-gray-900/20 border-gray-400
Background:     #FFFFFF
Icon-prefix:    левый отступ + иконка цвет #9CA3AF
```

### Карточки
```
Background:     #FFFFFF
Border:         1px solid #E5E7EB
Border-radius:  rounded-xl (12px)
Shadow:         shadow-sm  (0 1px 2px rgba(0,0,0,0.05))
Padding:        p-5 (20px) или p-6 (24px)
```

### Таблицы
```
Контейнер:      rounded-xl border border-gray-200 overflow-hidden

Thead:
  background:   #F9FAFB (gray-50)
  text:         12px font-semibold text-gray-500 uppercase
  padding:      px-4 py-3
  border-bottom: 1px solid #E5E7EB

Tbody row:
  background:   #FFFFFF
  hover:        #F9FAFB
  border-bottom: 1px solid #F3F4F6 (gray-100) — тонкий разделитель
  padding ячейки: px-4 py-3.5

Checkbox:       rounded-md, border-gray-300
Сортировка:     ChevronUp/Down иконка рядом с заголовком, 14px

Пагинация:
  Строк на стр.: select внизу слева
  Страницы:      кнопки с номерами справа
```

### Бейджи (Badge / Status)
```
Форма:          rounded-full (pill)
Padding:        px-2.5 py-0.5
Font:           12px font-medium
Dot вариант:    •  (8px circle) + text рядом
```

### Хедер
```
Height:         64px (h-16)
Background:     #FFFFFF
Border-bottom:  1px solid #E5E7EB
Padding:        px-6
Flex:           justify-between items-center

Левая часть:    Logo (в хедере или широкой панели) + поиск
Поиск:          ширина ~280-320px, фон #F9FAFB или белый с бордером, ⌘K shortcut badge
Правая часть:   иконки-кнопки (notification, etc.) + аватар профиля
Иконка-кнопка:  40x40px, rounded-lg или rounded-full, hover:bg-gray-100
```

### Страница (Page header)
```
Title:          text-2xl font-bold text-gray-900
Breadcrumb:     text-sm text-gray-500, разделитель "•" или "›"
Action buttons: top-right corner (Export + Primary action)
Поиск + фильтры: под заголовком, перед таблицей
Отступы:        gap между title и таблицей — 20-24px
```

### Навигация сайдбара (узкая)
```
Иконка + подпись: flex-col, items-center, gap-1
Иконка размер:    20px (h-5 w-5)
Подпись:          10px, text-center
Активный:         bg-white rounded-xl, белая иконка
Padding пункта:   px-2 py-2.5
```

### Навигация сайдбара (широкая)
```
Логотип:        text-lg font-bold, верх панели
Группа:         text-xs font-semibold text-gray-400 uppercase, mt-4 mb-1 px-3
Пункт:          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
Иконка:         16px (h-4 w-4), цвет inherit
Активный:       bg-gray-100 text-gray-900 font-semibold
Hover:          bg-gray-50
```

---

## Отступы

```
Шкала: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48px

Отступы страницы (контент):   px-6 py-6
Отступы карточки:             p-5 или p-6
Отступ между карточками:      gap-4 или gap-6
Отступ ячейки таблицы:        px-4 py-3 (стандарт) / py-3.5 (увеличенный)
Отступ кнопки:                px-4 py-2 (h-10)
Отступ поля:                  px-3 py-2 (h-10)
Зазор между иконкой и текстом: gap-2
```

---

## Прочее

### Тени
```
Cards/panels:   shadow-sm    — лёгкая тень
Modals/dropdowns: shadow-lg  — выраженная тень
Sidebar:        нет тени — используется border
```

### Анимации
```
Transition:  transition-all duration-200 ease-in-out
Hover scale: нет (только цвет)
Dropdown:    плавное появление
```

### Иконки
```
Библиотека:  Lucide React
Стиль:       outline (не filled) — единый стиль
Размер в nav: h-5 w-5 (20px)
Размер inline: h-4 w-4 (16px)
Размер в кнопке: h-4 w-4 или h-[18px] w-[18px]
Цвет:        inherit (наследует от текста)
```

### Бордер-радиусы
```
rounded-md:  6px  — небольшие элементы (checkbox, badge, небольшие кнопки)
rounded-lg:  8px  — кнопки, inputs, dropdown
rounded-xl:  12px — карточки, панели, модалки, контейнеры таблиц
rounded-2xl: 16px — крупные карточки (dashboard)
rounded-full: 9999px — аватары, pill-badges
```

---

## Паттерны страниц

### Страница-список (стандарт)
```
1. Заголовок + breadcrumb (левая колонка)
2. Кнопки действий — Export (secondary) + Add (primary black) (правая)
3. Строка фильтров: Search input слева + Filter / Column-toggle справа
4. Таблица в rounded-xl контейнере с border
5. Пагинация внизу таблицы
```

### Страница-форма
```
1. Заголовок + breadcrumb
2. Табы (если несколько разделов)
3. Секции с разделителями (dashed border-b)
4. Label слева (40% ширины) + поля справа (60%)
5. Footer: Cancel (secondary) + Save (primary black) — прижаты вправо
```

### Dashboard
```
1. KPI карточки вверху (4 в ряд)
2. Графики (2/3 + 1/3 сплит)
3. Таблицы / активности снизу
```
