import { useEffect, useRef } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useNotificationStore } from '@/shared/stores/useNotificationStore'
import { useToast } from '@/shared/ui-kit/Toaster'
import type { Notification } from '@/shared/data/types'

/**
 * Глобальный SignalR-клиент. На каждое событие order-status-changed:
 *   1) пушит в useNotificationStore → badge в Header растёт, popup-список в bell.
 *   2) показывает toast (visible popup в правом нижнем углу).
 *
 * Подключение через Gateway (ws://localhost:8080 → notification:8080).
 * Auth: HttpOnly cookie access_token приходит через withCredentials=true,
 * Notification.API читает её в JwtBearerEvents.OnMessageReceived.
 *
 * Группы:
 *   • drug-store-{drugStoreId}     — для клиентов аптеки
 *   • distributor-{distributorId}  — для distributor-portal (отдельный хук, TODO)
 */
export interface OrderStatusChangedPayload {
  type: 'order_status_changed'
  orderId: number
  orderNumber: string
  drugStoreId: number
  distributorId: number | null
  distributorName: string | null
  oldStatus: string
  newStatus: string
  occurredAt: string
}

const HUB_URL = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/hub/notifications`

/** Читает device_id из cookies (1-year long-lived, ставится бэком при login). */
function readDeviceIdCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)device_id=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function statusLabel(s: string): string {
  switch (s) {
    case 'pending':   return 'ожидает обработки'
    case 'modified':  return 'изменён дистрибьютором'
    case 'approved':  return 'подтверждён'
    case 'rejected':  return 'отклонён'
    case 'shipped':   return 'отгружен'
    case 'delivered': return 'доставлен'
    default:          return s
  }
}

// Toast.tsx supports: default | success | warning | danger | info.
// Раньше тут было 'error' — Radix-Toast его не знает → рендерил дефолтным серым
// (юзер жаловался «уведомления не заметны»). Сейчас rejected = 'danger' (красный).
function variantForStatus(newStatus: string): 'info' | 'success' | 'warning' | 'danger' {
  if (newStatus === 'approved' || newStatus === 'shipped' || newStatus === 'delivered') return 'success'
  if (newStatus === 'rejected') return 'danger'
  if (newStatus === 'modified') return 'warning'
  return 'info'
}

/** Простой "ding" через WebAudio — без файлов в bundle. */
function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch { /* AudioContext недоступен — игнор */ }
}

/**
 * Браузерное системное уведомление (Netflix/Telegram-style — всплывает в углу ОС).
 * Каждое уведомление получает уникальный tag → они стэкаются (а не replace).
 * Клик по уведомлению — возвращает фокус во вкладку (window.focus()).
 *
 * Permission запрашивается ПРОактивно при логине (см. useEffect ниже),
 * чтобы первое уведомление не падало в default-состоянии.
 */
function showBrowserNotification(title: string, body: string) {
  try {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return // не показано → permission прозвали лениво ниже
    const n = new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      // Уникальный tag — каждое уведомление в стэке отдельно (не replace'ит предыдущее).
      tag: `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    })
    n.onclick = () => {
      try { window.focus(); n.close() } catch { /* ignored */ }
    }
    // Авто-close через 10 сек на десктопах (mobile-firefox игнорит).
    setTimeout(() => { try { n.close() } catch { /* */ } }, 10000)
  } catch { /* SecurityError на http без localhost — игнор */ }
}

/**
 * Title-flash — когда tab свёрнут, в шапке вкладки мигает «(1) Заказ изменён …».
 * Дополнительный визуальный канал поверх ОС-нотификации (на случай если permission denied).
 * Сбрасывается когда юзер возвращается на вкладку.
 */
let originalTitle = ''
let flashTimer: number | null = null
function flashTitle(text: string) {
  if (document.visibilityState === 'visible') return
  if (!originalTitle) originalTitle = document.title
  if (flashTimer !== null) window.clearInterval(flashTimer)
  let on = true
  flashTimer = window.setInterval(() => {
    document.title = on ? `🔔 ${text}` : originalTitle
    on = !on
  }, 1000)
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && flashTimer !== null) {
      window.clearInterval(flashTimer)
      flashTimer = null
      if (originalTitle) document.title = originalTitle
    }
  })
}

export function useOrderNotifications() {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  const userId      = useAuthStore((s) => s.user?.id ?? null)
  const logout      = useAuthStore((s) => s.logout)
  const isAuth      = useAuthStore((s) => s.isAuthenticated)
  const connRef     = useRef<HubConnection | null>(null)
  const { toast }   = useToast()

  // Проактивный запрос permission на ОС-уведомления при первом логине.
  // Без него первое реальное событие fall through — Notification.permission='default'
  // и showBrowserNotification ничего не показывает. С проактивным запросом
  // браузер сразу показывает диалог «Разрешить уведомления?»
  useEffect(() => {
    if (!isAuth) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      // requestPermission() возвращает Promise; ошибки игнорируем (SecurityError
      // на http без localhost, или user dismissed).
      void Notification.requestPermission().catch(() => { /* */ })
    }
  }, [isAuth])

  useEffect(() => {
    if (!isAuth || !drugStoreId) return

    // React StrictMode фаерит useEffect дважды (mount → unmount → mount).
    // Между этими циклами connection ещё в фазе negotiate → stop() её рвёт.
    // Защищаемся флагом и небольшим debounce: реально стартуем через 50мс,
    // если за это время cleanup не сработал.
    let cancelled = false

    const conn = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // HttpOnly cookie прилетит через withCredentials. accessTokenFactory не нужен.
        withCredentials: true,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build()

    connRef.current = conn

    conn.on('OrderStatusChanged', (p: OrderStatusChangedPayload) => {
      const title = `Заказ ${p.orderNumber}`
      const text  = `${p.distributorName ?? 'Дистрибьютор'} → ${statusLabel(p.newStatus)}`
      const variant = variantForStatus(p.newStatus)

      // Явный тип Notification — иначе литералы 'type' расширяются до string и
      // не лезут в Notification['type']. Notification.type = 'error' (Toast — 'danger').
      const entry: Notification = {
        id: `order-${p.orderId}-${Date.now()}`,
        type: variant === 'danger' ? 'error' : variant,
        title,
        message: text,
        read: false,
        createdAt: p.occurredAt ?? new Date().toISOString(),
      }
      useNotificationStore.setState((s) => ({
        notifications: [entry, ...s.notifications].slice(0, 50),
      }))

      // Visible toast popup
      toast({ title, description: text, variant })
      // Звуковой сигнал — всегда.
      playChime()
      // ОС-уровневая нотификация + title-flash — только если tab не активен.
      // (Netflix/Telegram pattern: важные события всплывают в углу ОС.)
      if (document.visibilityState !== 'visible') {
        showBrowserNotification(title, text)
        flashTitle(`${title} · ${statusLabel(p.newStatus)}`)
      }
    })

    // ── Real-time logout. ExternalAuth пушит SessionRevoked в группу user-{id} —
    // в группе все устройства user'а. Фильтруем по targetDeviceIds: logout
    // только если МОЙ device_id (cookie) в списке. Раньше без фильтра kick одного
    // устройства логаутил все вкладки.
    conn.on('SessionRevoked', (payload: { reason?: string; targetDeviceIds?: string[] }) => {
      const myDeviceId = readDeviceIdCookie()
      const targets = Array.isArray(payload?.targetDeviceIds) ? payload.targetDeviceIds : null

      // Если targets есть и моего device_id там нет — это не про меня.
      if (targets && targets.length > 0 && myDeviceId && !targets.includes(myDeviceId)) {
        console.info('[SignalR] SessionRevoked — not for me', { mine: myDeviceId, targets })
        return
      }
      // Backward compat: payload без targets (старый бэк) — fallback на старое поведение.
      console.warn('[SignalR] SessionRevoked — logging out', payload)
      toast({
        title: 'Сессия завершена',
        description: payload?.reason === 'password_changed'
          ? 'Пароль изменён на другом устройстве'
          : 'Вы вышли с этого устройства',
        variant: 'warning',
      })
      void logout().finally(() => {
        if (typeof window !== 'undefined') window.location.assign('/login')
      })
    })

    conn.onreconnecting((err) => console.info('[SignalR] reconnecting', err?.message))
    conn.onreconnected((id) => {
      console.info('[SignalR] reconnected', id)
      void conn.invoke('JoinGroup', `drug-store-${drugStoreId}`).catch(() => {})
      if (userId) void conn.invoke('JoinGroup', `user-${userId}`).catch(() => {})
    })
    conn.onclose((err) => console.warn('[SignalR] closed', err?.message))

    const startTimer = setTimeout(() => {
      if (cancelled) return
      conn.start()
        .then(async () => {
          if (cancelled) {
            void conn.stop()
            return
          }
          await conn.invoke('JoinGroup', `drug-store-${drugStoreId}`)
          if (userId) await conn.invoke('JoinGroup', `user-${userId}`).catch(() => {})
          console.info('[SignalR] connected, joined drug-store-' + drugStoreId + (userId ? ', user-' + userId : ''))
        })
        .catch((err) => {
          // StrictMode-double-mount даёт "stopped during negotiation" — не паникуем.
          if (!cancelled) console.warn('[SignalR] connect failed:', err?.message ?? err)
        })
    }, 50)

    return () => {
      cancelled = true
      clearTimeout(startTimer)
      // Стопаем только если connection реально стартовал. В состоянии Connecting
      // мы оставляем cancelled=true — флаг внутри .then сделает stop() сам.
      if (conn.state === HubConnectionState.Connected
          || conn.state === HubConnectionState.Reconnecting) {
        void conn.stop()
      }
      connRef.current = null
    }
  }, [isAuth, drugStoreId, userId, logout, toast])

  return null
}
