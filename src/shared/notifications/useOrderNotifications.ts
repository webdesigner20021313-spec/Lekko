import { useEffect, useRef } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useNotificationStore } from '@/shared/stores/useNotificationStore'
import { useToast } from '@/shared/ui-kit/Toaster'

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

function variantForStatus(newStatus: string): 'info' | 'success' | 'warning' | 'error' {
  if (newStatus === 'approved' || newStatus === 'shipped' || newStatus === 'delivered') return 'success'
  if (newStatus === 'rejected') return 'error'
  if (newStatus === 'modified') return 'warning'
  return 'info'
}

export function useOrderNotifications() {
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)
  const isAuth      = useAuthStore((s) => s.isAuthenticated)
  const connRef     = useRef<HubConnection | null>(null)
  const { toast }   = useToast()

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

      useNotificationStore.setState((s) => ({
        notifications: [
          {
            id: `order-${p.orderId}-${Date.now()}`,
            type: variant,
            title,
            message: text,
            read: false,
            createdAt: p.occurredAt ?? new Date().toISOString(),
          },
          ...s.notifications,
        ].slice(0, 50),
      }))

      // Visible toast popup
      toast({ title, description: text, variant })
    })

    conn.onreconnecting((err) => console.info('[SignalR] reconnecting', err?.message))
    conn.onreconnected((id) => {
      console.info('[SignalR] reconnected', id)
      void conn.invoke('JoinGroup', `drug-store-${drugStoreId}`).catch(() => {})
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
          console.info('[SignalR] connected, joined drug-store-' + drugStoreId)
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
  }, [isAuth, drugStoreId, toast])

  return null
}
