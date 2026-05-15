import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: {
        sitekey: string
        callback: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
        theme?: 'light' | 'dark' | 'auto'
        size?: 'normal' | 'compact' | 'flexible'
      }) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

const SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit'

let scriptLoaded = false
let scriptLoading: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve()
  if (scriptLoading) return scriptLoading
  scriptLoading = new Promise((resolve, reject) => {
    window.onloadTurnstileCallback = () => {
      scriptLoaded = true
      resolve()
    }
    const s = document.createElement('script')
    s.src = SCRIPT_URL
    s.async = true
    s.defer = true
    s.onerror = () => reject(new Error('Turnstile script load failed'))
    document.head.appendChild(s)
  })
  return scriptLoading
}

interface Props {
  sitekey: string
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
}

/**
 * Cloudflare Turnstile widget — minimal обёртка без зависимостей.
 * Загружает скрипт CF лениво, рендерит widget в div, вызывает onVerify(token)
 * когда CF выдал успешный токен. Token нужно передать на бэк в `captchaToken`
 * поле login-запроса.
 *
 * Test sitekey для dev (всегда passes): `1x00000000000000000000AA`.
 */
export function TurnstileWidget({ sitekey, onVerify, onExpire, onError }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadScript().then(() => {
      if (cancelled || !ref.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(ref.current, {
        sitekey,
        callback: onVerify,
        'expired-callback': () => onExpire?.(),
        'error-callback': () => onError?.(),
        theme: 'auto',
        size: 'flexible',
      })
    })
    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch { /* ignore */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitekey])

  return <div ref={ref} className="my-2" />
}
