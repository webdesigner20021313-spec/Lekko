import { useState, useCallback, createContext, useContext } from 'react'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/shared/ui-kit/Toast'
import type { ToastProps } from '@/shared/ui-kit/Toast'

type ToastVariant = NonNullable<ToastProps['variant']>

interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within Toaster')
  return ctx
}

let toastId = 0

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = String(++toastId)
    setToasts((prev) => [...prev.slice(-2), { ...opts, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {/* duration=8000 — раньше использовался Radix-дефолт 5s, и для order-status уведомлений
        юзер не успевал среагировать. Сейчас 8 сек — баланс между «успеваю прочитать» и «не мешает». */}
      <ToastProvider duration={8000} swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            onOpenChange={(open) => {
              if (!open) removeToast(t.id)
            }}
          >
            <div className="grid gap-1">
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && (
                <ToastDescription>{t.description}</ToastDescription>
              )}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}
