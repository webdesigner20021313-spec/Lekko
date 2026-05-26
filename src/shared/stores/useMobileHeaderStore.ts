import { useEffect } from 'react'
import { create } from 'zustand'
import type { LucideIcon } from 'lucide-react'

/**
 * Действия для правого слота мобильного header'а на section-страницах
 * (фильтры, экспорт, refresh и т.п.). Описываются примитивами, а не JSX —
 * чтобы Header сам собирал кнопки в едином стиле и не было проблем со
 * stale-замыканиями/пересозданием React-узлов на каждом ререндере.
 */
export type HeaderActionVariant = 'default' | 'active' | 'success'

export interface HeaderAction {
  id: string
  icon: LucideIcon
  onClick: () => void
  ariaLabel: string
  variant?: HeaderActionVariant
  /** Точка-индикатор (например, активные фильтры). */
  indicator?: boolean
}

/**
 * Конфиг поиска для мобильного header'а. Если страница его регистрирует,
 * вместо заголовка появляется иконка-лупа; по тапу инпут раскрывается на
 * всю ширину header'а (back-стрелка тогда закрывает поиск, action'ы прячутся).
 */
export interface HeaderSearch {
  value: string
  onChange: (v: string) => void
  placeholder: string
}

interface State {
  actions: HeaderAction[] | null
  setActions: (a: HeaderAction[] | null) => void
  search: HeaderSearch | null
  setSearch: (s: HeaderSearch | null) => void
  /** Кастомный заголовок раздела (для подмаршрутов: ID заказа, имя пользователя и т.п.). */
  title: string | null
  setTitle: (t: string | null) => void
  /** Перехват back-кнопки. Если задан, Header вызовет его вместо обычного navigate(parent).
      Используется для in-page detail-view (когда «назад» должно закрыть панель, а не покинуть страницу). */
  onBack: (() => void) | null
  setOnBack: (cb: (() => void) | null) => void
}

export const useMobileHeaderStore = create<State>((set) => ({
  actions: null,
  setActions: (actions) => set({ actions }),
  search: null,
  setSearch: (search) => set({ search }),
  title: null,
  setTitle: (title) => set({ title }),
  onBack: null,
  setOnBack: (onBack) => set({ onBack }),
}))

/**
 * Регистрирует действия в правом слоте мобильного header'а на время жизни
 * компонента. Массив `actions` должен быть мемоизирован (или в deps попадут
 * нужные значения), иначе эффект перезапустится на каждом ререндере.
 */
export function useMobileHeaderActions(actions: HeaderAction[] | null) {
  useEffect(() => {
    useMobileHeaderStore.getState().setActions(actions)
    return () => useMobileHeaderStore.getState().setActions(null)
  }, [actions])
}

/**
 * Регистрирует поиск в мобильном header'е. `search` должен быть мемоизирован
 * (useMemo по value/onChange/placeholder).
 */
export function useMobileHeaderSearch(search: HeaderSearch | null) {
  useEffect(() => {
    useMobileHeaderStore.getState().setSearch(search)
    return () => useMobileHeaderStore.getState().setSearch(null)
  }, [search])
}

/**
 * Переопределяет заголовок в мобильном header'е (вместо вычисленного из пути).
 * Используется на подмаршрутах: например, страница заказа ставит его номер.
 */
export function useMobileHeaderTitle(title: string | null) {
  useEffect(() => {
    useMobileHeaderStore.getState().setTitle(title)
    return () => useMobileHeaderStore.getState().setTitle(null)
  }, [title])
}

/**
 * Перехватывает back-кнопку мобильного header'а. Если задан handler — он будет вызван
 * вместо стандартного navigate-в-родительский-путь. Используется для in-page detail-view,
 * когда «назад» должно закрыть панель, а не покинуть страницу.
 */
export function useMobileHeaderBack(onBack: (() => void) | null) {
  useEffect(() => {
    useMobileHeaderStore.getState().setOnBack(onBack)
    return () => useMobileHeaderStore.getState().setOnBack(null)
  }, [onBack])
}
