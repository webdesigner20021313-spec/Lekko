import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, User, Lock, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/ui-kit/Button'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { cn } from '@/shared/utils/utils'
import { detectMode } from '@/config/mode'
import { getLogoForMode } from '@/config/products'

// ── Forgot-password modal ──────────────────────────────────────────────────

type ForgotStep = 'phone' | 'code' | 'done'

const MOCK_CODE = '123456'

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [step, setStep] = useState<ForgotStep>('phone')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')

  function handleSendCode() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 9) {
      setPhoneError(t('forgot_phone_error'))
      return
    }
    setPhoneError('')
    setStep('code')
  }

  function handleVerifyCode() {
    if (code.trim() !== MOCK_CODE) {
      setCodeError(t('forgot_code_error'))
      return
    }
    setCodeError('')
    setStep('done')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-[#111111]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label={t('modal_close')}
        >
          <X size={18} />
        </button>

        {step === 'phone' && (
          <>
            <h2 className="mb-1 text-[17px] font-semibold text-gray-900 dark:text-gray-100">{t('forgot_title')}</h2>
            <p className="mb-5 text-sm text-gray-500">
              {t('forgot_subtitle')}
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('forgot_phone_label')}</label>
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError('') }}
                  autoFocus
                  className={cn(
                    'h-11 w-full rounded-xl border bg-gray-50 px-4 text-sm text-gray-800 placeholder:text-gray-400',
                    'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
                    'dark:bg-[#222222] dark:text-gray-200 dark:placeholder:text-gray-500',
                    phoneError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 dark:border-gray-700 dark:focus:border-gray-500'
                  )}
                />
                {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
              </div>
              <Button variant="primary" size="md" className="w-full rounded-xl" onClick={handleSendCode}>
                {t('forgot_send_code')}
              </Button>
            </div>
          </>
        )}

        {step === 'code' && (
          <>
            <h2 className="mb-1 text-[17px] font-semibold text-gray-900 dark:text-gray-100">{t('forgot_code_title')}</h2>
            <p className="mb-4 text-sm text-gray-500">
              {t('forgot_code_sent')}{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">{phone}</span>
            </p>
            <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {t('forgot_demo_hint')}{' '}
              <span className="font-bold tracking-widest">{MOCK_CODE}</span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('forgot_code_label')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (codeError) setCodeError('') }}
                  autoFocus
                  className={cn(
                    'h-11 w-full rounded-xl border bg-gray-50 px-4 text-sm tracking-widest text-gray-800 placeholder:text-gray-400',
                    'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
                    'dark:bg-[#222222] dark:text-gray-200 dark:placeholder:text-gray-500',
                    codeError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 dark:border-gray-700 dark:focus:border-gray-500'
                  )}
                />
                {codeError && <p className="text-xs text-red-500">{codeError}</p>}
              </div>
              <Button variant="primary" size="md" className="w-full rounded-xl" onClick={handleVerifyCode} disabled={code.length !== 6}>
                {t('forgot_confirm')}
              </Button>
              <button type="button" className="text-center text-sm text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-300"
                onClick={() => { setCode(''); setCodeError(''); setStep('phone') }}>
                {t('forgot_change_phone')}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center py-2 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mb-1 text-[17px] font-semibold text-gray-900 dark:text-gray-100">{t('forgot_done_title')}</h2>
            <p className="mb-6 text-sm text-gray-500">
              {t('forgot_done_subtitle')}
            </p>
            <Button variant="primary" size="md" className="w-full rounded-xl" onClick={onClose}>
              {t('forgot_back_to_login')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Login page ─────────────────────────────────────────────────────────────

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const appMode = detectMode()
  const logoSvg = getLogoForMode(appMode.productId)

  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [authError, setAuthError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const rawFrom =
    (location.state as { from?: { pathname: string } })?.from?.pathname
  const defaultLanding = appMode.mode === 'portal' ? '/' : '/purchase'
  const from = !rawFrom || rawFrom === '/login' ? defaultLanding : rawFrom

  function validate() {
    let ok = true
    if (!loginValue.trim()) { setLoginError(t('login_error_required')); ok = false } else setLoginError('')
    if (!password) { setPasswordError(t('password_error_required')); ok = false } else setPasswordError('')
    return ok
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    if (!validate()) return
    setIsLoading(true)
    const result = await login(loginValue, password)
    setIsLoading(false)
    if (result.ok) {
      navigate(from, { replace: true })
      return
    }
    if (result.reason === 'license_expired') {
      const days = result.details.daysRemains
      const reason = result.details.blockReason
      setAuthError(
        `Лицензия истекла${days ? ` (осталось дней: ${days})` : ''}${reason ? `: ${reason}` : ''}`,
      )
      return
    }
    if (result.reason === 'invalid_credentials') {
      setAuthError(t('auth_error'))
      return
    }
    setAuthError(result.message || t('auth_error'))
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-4 dark:bg-gray-950">

      {/* card */}
      <div className="w-full max-w-[420px] rounded-2xl bg-white px-8 py-8 shadow-sm dark:bg-[#111111]">

        {/* logo inside card */}
        <div className="mb-6 flex justify-center">
          <img src={logoSvg} alt="Lekko" className="h-10 w-auto" />
        </div>

        {/* title */}
        <div className="mb-6">
          <h1 className="text-[20px] font-bold text-gray-900 dark:text-gray-100">{t('login_title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('login_subtitle')}</p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

          {/* login field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('login_label')}</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('login_placeholder')}
                value={loginValue}
                onChange={(e) => {
                  setLoginValue(e.target.value)
                  if (loginError) setLoginError('')
                  if (authError) setAuthError('')
                }}
                autoComplete="username"
                autoFocus
                className={cn(
                  'h-11 w-full rounded-xl border bg-gray-50 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400',
                  'transition-colors focus:outline-none focus:bg-white focus:ring-2 focus:ring-offset-1',
                  'dark:bg-[#222222] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:bg-gray-700',
                  loginError || authError
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-gray-200 focus:border-gray-400 focus:ring-gray-900/10 dark:border-gray-700 dark:focus:border-gray-500'
                )}
              />
            </div>
            {loginError && <p className="text-xs text-red-500">{loginError}</p>}
          </div>

          {/* password field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('password_label')}</label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {t('forgot_password')}
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('password_placeholder')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) setPasswordError('')
                  if (authError) setAuthError('')
                }}
                autoComplete="current-password"
                className={cn(
                  'h-11 w-full rounded-xl border bg-gray-50 pl-10 pr-10 text-sm text-gray-800 placeholder:text-gray-400',
                  'transition-colors focus:outline-none focus:bg-white focus:ring-2 focus:ring-offset-1',
                  'dark:bg-[#222222] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:bg-gray-700',
                  passwordError || authError
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-gray-200 focus:border-gray-400 focus:ring-gray-900/10 dark:border-gray-700 dark:focus:border-gray-500'
                )}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-300"
                aria-label={showPassword ? t('password_hide') : t('password_show')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
          </div>

          {/* auth error */}
          {authError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {authError}
            </div>
          )}

          {/* submit */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="mt-1 w-full rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('login_loading')}
              </span>
            ) : (
              t('login_submit')
            )}
          </Button>
        </form>

        {/* divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">{t('login_or')}</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* register link */}
        <p className="text-center text-sm text-gray-500">
          {t('login_no_account')}{' '}
          <span className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 transition-colors">
            {t('login_request')}
          </span>
        </p>
      </div>

      {/* footer */}
      <p className="mt-6 max-w-[360px] text-center text-[12px] text-gray-400">
        {t('login_terms')}{' '}
        <span className="underline cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">{t('login_terms_link')}</span>
        {' '}{t('login_terms_and')}{' '}
        <span className="underline cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">{t('login_privacy_link')}</span>
      </p>

      {/* forgot password modal */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  )
}
