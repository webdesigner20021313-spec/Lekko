import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Shield, Save, Loader2, Trash2, Eye, EyeOff, Monitor } from 'lucide-react'
import {
  useChangePassword,
  useActiveSessions,
  useRevokeOtherSessions,
  useRevokeSession,
  type SessionDto,
} from '@/products/megaprice/api/hooks'
import { useToast } from '@/shared/ui-kit/Toaster'
import { Button } from '@/shared/ui-kit/Button'
import { cn } from '@/shared/utils/utils'

/**
 * Секция «Безопасность» на странице /profile.
 *  - Смена пароля → POST /api/auth/change-password (бэк revoke'ает чужие сессии)
 *  - Список активных сессий + завершение
 */
export function SecuritySection() {
  return (
    <div className="space-y-6">
      <PasswordChangeBlock />
      <SessionsBlock />
    </div>
  )
}

// ── Password change ────────────────────────────────────────────────────────

function PasswordChangeBlock() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const changeApi = useChangePassword()

  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const mismatch = confirmPwd !== '' && confirmPwd !== newPwd
  const tooShort = newPwd !== '' && newPwd.length < 6
  const canSubmit =
    oldPwd.length > 0 && newPwd.length >= 6 && newPwd === confirmPwd && !changeApi.isLoading

  function handleSubmit() {
    if (!canSubmit) return
    changeApi.appendData({ oldPassword: oldPwd, newPassword: newPwd }, undefined, () => {
      // Success branch: useQueryApiClient зовёт нас только когда статус успешный.
      toast({
        title: t('security_pwd_changed_title', { defaultValue: 'Пароль изменён' }),
        description: t('security_pwd_changed_desc', { defaultValue: 'На остальных устройствах вы будете разлогинены.' }),
        variant: 'success',
      })
      setOldPwd(''); setNewPwd(''); setConfirmPwd('')
    })
  }

  // Error display — useQueryApiClient ставит isError + сообщения; разберём через переменную.
  const apiError = changeApi.isError
    ? t('security_pwd_failed', { defaultValue: 'Не удалось изменить пароль. Проверьте текущий пароль.' })
    : null

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#1a1a1a]">
      <div className="mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
        <Lock className="h-5 w-5" />
        <h2 className="text-base font-semibold">{t('security_password_title', { defaultValue: 'Смена пароля' })}</h2>
      </div>

      <div className="space-y-3">
        <PasswordField
          label={t('security_pwd_old', { defaultValue: 'Текущий пароль' })}
          value={oldPwd} onChange={setOldPwd}
          show={showOld} toggleShow={() => setShowOld((v) => !v)}
        />
        <PasswordField
          label={t('security_pwd_new', { defaultValue: 'Новый пароль' })}
          value={newPwd} onChange={setNewPwd}
          show={showNew} toggleShow={() => setShowNew((v) => !v)}
          error={tooShort ? t('security_pwd_too_short', { defaultValue: 'Минимум 6 символов' }) : undefined}
        />
        <PasswordField
          label={t('security_pwd_confirm', { defaultValue: 'Повторите новый' })}
          value={confirmPwd} onChange={setConfirmPwd}
          show={showNew} toggleShow={() => setShowNew((v) => !v)}
          error={mismatch ? t('security_pwd_mismatch', { defaultValue: 'Пароли не совпадают' }) : undefined}
        />

        {apiError && (
          <p className="text-xs text-red-500">{apiError}</p>
        )}

        <div className="flex justify-end pt-1">
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {changeApi.isLoading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('settings_saving', { defaultValue: 'Сохраняем…' })}</>
              : <><Save className="mr-2 h-4 w-4" /> {t('security_pwd_submit', { defaultValue: 'Сменить пароль' })}</>}
          </Button>
        </div>
      </div>
    </section>
  )
}

function PasswordField({ label, value, onChange, show, toggleShow, error }: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  toggleShow: () => void
  error?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-500 dark:text-[#929292]">{label}</label>
      <div className={cn(
        'flex items-center gap-2 rounded-lg border bg-white px-3 py-2 transition-colors dark:bg-[#222222]',
        error ? 'border-red-300 dark:border-red-700' : 'border-gray-200 focus-within:border-gray-400 dark:border-gray-700',
      )}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
        />
        <button type="button" onClick={toggleShow} className="text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Sessions ───────────────────────────────────────────────────────────────

function SessionsBlock() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const sessionsApi = useActiveSessions()
  const revokeOthersApi = useRevokeOtherSessions()
  const revokeOneApi = useRevokeSession()

  const sessions: SessionDto[] = Array.isArray(sessionsApi.data) ? sessionsApi.data : []
  const otherCount = sessions.filter((s) => !s.isCurrent).length

  function handleRevokeOthers() {
    if (otherCount === 0) return
    revokeOthersApi.appendData({}, undefined, () => {
      toast({
        title: t('security_others_revoked', { defaultValue: 'Вы вышли с других устройств' }),
        variant: 'success',
      })
      void sessionsApi.refetch()
    })
  }

  function handleRevokeOne(id: number) {
    revokeOneApi.appendData({}, { id }, () => {
      toast({ title: t('security_session_closed', { defaultValue: 'Сессия закрыта' }), variant: 'success' })
      void sessionsApi.refetch()
    })
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#1a1a1a]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Shield className="h-5 w-5" />
          <h2 className="text-base font-semibold">{t('security_sessions_title', { defaultValue: 'Активные сессии' })}</h2>
        </div>
        {otherCount > 0 && (
          <Button variant="outline" onClick={handleRevokeOthers} disabled={revokeOthersApi.isLoading}>
            {t('security_sessions_revoke_others', { defaultValue: 'Выйти с других' })}
            <span className="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">{otherCount}</span>
          </Button>
        )}
      </div>

      {sessionsApi.isLoading && sessions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" /> {t('common_loading', { defaultValue: 'Загрузка…' })}
        </div>
      ) : sessions.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          {t('security_no_sessions', { defaultValue: 'Активных сессий нет' })}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-[#333333]">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <Monitor className="h-5 w-5 text-gray-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {parseDeviceLabel(s.userAgent)}
                  </p>
                  {s.isCurrent && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {t('security_current_session', { defaultValue: 'текущая' })}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatIp(s.ipAddress)} · {t('security_session_created', { defaultValue: 'вход' })}: {formatDateTime(s.createdAt)}
                  {s.deviceId && <span className="ml-1 text-gray-300 dark:text-gray-600">· #{s.deviceId.slice(-6)}</span>}
                  {!s.deviceId && <span className="ml-1 text-amber-500" title="legacy session: relogin to enable device-isolated revoke">· legacy</span>}
                </p>
              </div>
              {!s.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevokeOne(s.id)}
                  disabled={revokeOneApi.isLoading}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
                  title={t('security_session_revoke', { defaultValue: 'Закрыть' }) ?? ''}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * Парсит User-Agent → «Chrome 120 · Windows 11» / «Safari 17 · iPhone (iOS 17)».
 * Inline без зависимостей (ua-parser-js — 8kb, overkill для 4 строчек regex).
 * Покрывает основные браузеры и ОС; для экзотики (Opera GX, Vivaldi, Tizen)
 * fall back на сырой UA.
 */
function parseDeviceLabel(ua: string | null): string {
  // user_agent в БД может быть NULL для старых сессий (login через curl/тесты)
  // или service-token-сценариев. Показываем нейтральный label, а не пугающее
  // «Unknown device».
  if (!ua) return 'Веб-клиент'

  // ── Browser + version ──
  let browser = ''
  let edgeM   = ua.match(/Edg(?:e|A|iOS)?\/([\d.]+)/i)
  let chromeM = ua.match(/Chrome\/([\d.]+)/i)
  let firefoxM = ua.match(/Firefox\/([\d.]+)/i)
  let safariM = ua.match(/Version\/([\d.]+).*Safari/i)
  let operaM  = ua.match(/OPR\/([\d.]+)/i)
  let samsungM = ua.match(/SamsungBrowser\/([\d.]+)/i)
  let yandexM = ua.match(/YaBrowser\/([\d.]+)/i)

  if (yandexM)        browser = `Yandex ${majorOf(yandexM[1])}`
  else if (samsungM)  browser = `Samsung Internet ${majorOf(samsungM[1])}`
  else if (operaM)    browser = `Opera ${majorOf(operaM[1])}`
  else if (edgeM)     browser = `Edge ${majorOf(edgeM[1])}`
  else if (chromeM)   browser = `Chrome ${majorOf(chromeM[1])}`
  else if (firefoxM)  browser = `Firefox ${majorOf(firefoxM[1])}`
  else if (safariM)   browser = `Safari ${majorOf(safariM[1])}`

  // ── OS + version ──
  let os = ''
  if (/iPhone/.test(ua)) {
    const m = ua.match(/OS (\d+[_\d]*) like Mac/)
    os = m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS'
    os = `iPhone · ${os}`
  } else if (/iPad/.test(ua)) {
    const m = ua.match(/OS (\d+[_\d]*) like Mac/)
    os = m ? `iPad · iOS ${m[1].replace(/_/g, '.')}` : 'iPad'
  } else if (/Android/.test(ua)) {
    const m = ua.match(/Android (\d+(?:\.\d+)?)/)
    os = m ? `Android ${m[1]}` : 'Android'
  } else if (/Windows NT 10/.test(ua)) {
    // Windows NT 10.0 — это и Win10 и Win11; различить можно только по client hints.
    os = 'Windows 10/11'
  } else if (/Windows NT 6.3/.test(ua)) os = 'Windows 8.1'
  else if (/Windows NT 6.2/.test(ua))   os = 'Windows 8'
  else if (/Windows NT 6.1/.test(ua))   os = 'Windows 7'
  else if (/Windows/.test(ua))          os = 'Windows'
  else if (/Mac OS X (\d+[._\d]*)/.test(ua)) {
    const m = ua.match(/Mac OS X (\d+[._\d]*)/)!
    os = `macOS ${m[1].replace(/_/g, '.')}`
  } else if (/Linux/.test(ua))          os = 'Linux'

  if (browser && os) return `${browser} · ${os}`
  if (browser) return browser
  if (os) return os
  return ua.slice(0, 50)
}

function majorOf(version: string): string {
  return version.split('.')[0] ?? version
}

/** Убирает IPv6-prefix `::ffff:` для IPv4-mapped адресов (Docker network). */
function formatIp(ip: string | null): string {
  if (!ip) return '—'
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
