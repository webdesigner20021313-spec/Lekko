import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  const [step, setStep] = useState<ForgotStep>('phone')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')

  function handleSendCode() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 9) {
      setPhoneError('Введите корректный номер телефона')
      return
    }
    setPhoneError('')
    setStep('code')
  }

  function handleVerifyCode() {
    if (code.trim() !== MOCK_CODE) {
      setCodeError('Неверный код. Попробуйте снова')
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
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Закрыть"
        >
          <X size={18} />
        </button>

        {step === 'phone' && (
          <>
            <h2 className="mb-1 text-[17px] font-semibold text-gray-900">Восстановление пароля</h2>
            <p className="mb-5 text-sm text-gray-500">
              Введите номер телефона — отправим SMS с кодом
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Номер телефона</label>
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError('') }}
                  autoFocus
                  className={cn(
                    'h-11 w-full rounded-xl border bg-gray-50 px-4 text-sm text-gray-800 placeholder:text-gray-400',
                    'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
                    phoneError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
                  )}
                />
                {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
              </div>
              <Button variant="primary" size="md" className="w-full rounded-xl" onClick={handleSendCode}>
                Получить код
              </Button>
            </div>
          </>
        )}

        {step === 'code' && (
          <>
            <h2 className="mb-1 text-[17px] font-semibold text-gray-900">Введите код</h2>
            <p className="mb-4 text-sm text-gray-500">
              Код отправлен на{' '}
              <span className="font-medium text-gray-700">{phone}</span>
            </p>
            <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
              Демо-режим: ваш код —{' '}
              <span className="font-bold tracking-widest">{MOCK_CODE}</span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">6-значный код</label>
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
                    codeError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200'
                  )}
                />
                {codeError && <p className="text-xs text-red-500">{codeError}</p>}
              </div>
              <Button variant="primary" size="md" className="w-full rounded-xl" onClick={handleVerifyCode} disabled={code.length !== 6}>
                Подтвердить
              </Button>
              <button type="button" className="text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => { setCode(''); setCodeError(''); setStep('phone') }}>
                Изменить номер
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center py-2 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="mb-1 text-[17px] font-semibold text-gray-900">Код подтверждён</h2>
            <p className="mb-6 text-sm text-gray-500">
              Войдите с текущими данными аккаунта.
            </p>
            <Button variant="primary" size="md" className="w-full rounded-xl" onClick={onClose}>
              Вернуться ко входу
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Login page ─────────────────────────────────────────────────────────────

export function LoginPage() {
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
  const from = !rawFrom || rawFrom === '/' ? '/purchase' : rawFrom

  function validate() {
    let ok = true
    if (!loginValue.trim()) { setLoginError('Введите логин'); ok = false } else setLoginError('')
    if (!password) { setPasswordError('Введите пароль'); ok = false } else setPasswordError('')
    return ok
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')
    if (!validate()) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    const ok = login(loginValue, password)
    setIsLoading(false)
    if (ok) {
      navigate(from, { replace: true })
    } else {
      setAuthError('Неверный логин или пароль')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-4">

      {/* card */}
      <div className="w-full max-w-[420px] rounded-2xl bg-white px-8 py-8 shadow-sm">

        {/* logo inside card */}
        <div className="mb-6 flex justify-center">
          <img src={logoSvg} alt="Lekko" className="h-10 w-auto" />
        </div>

        {/* title */}
        <div className="mb-6">
          <h1 className="text-[20px] font-bold text-gray-900">Войти в аккаунт</h1>
          <p className="mt-1 text-sm text-gray-500">Введите логин и пароль для входа</p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

          {/* login field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Логин</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Введите логин"
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
                  loginError || authError
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-gray-200 focus:border-gray-400 focus:ring-gray-900/10'
                )}
              />
            </div>
            {loginError && <p className="text-xs text-red-500">{loginError}</p>}
          </div>

          {/* password field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Пароль</label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Забыли пароль?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Введите пароль"
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
                  passwordError || authError
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-gray-200 focus:border-gray-400 focus:ring-gray-900/10'
                )}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
          </div>

          {/* auth error */}
          {authError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
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
                Входим...
              </span>
            ) : (
              'Войти'
            )}
          </Button>
        </form>

        {/* divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">или</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* register link */}
        <p className="text-center text-sm text-gray-500">
          Нет аккаунта?{' '}
          <span className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 transition-colors">
            Оставить заявку
          </span>
        </p>
      </div>

      {/* footer */}
      <p className="mt-6 max-w-[360px] text-center text-[12px] text-gray-400">
        Нажимая «Войти», вы соглашаетесь с{' '}
        <span className="underline cursor-pointer hover:text-gray-600">Условиями использования</span>
        {' '}и{' '}
        <span className="underline cursor-pointer hover:text-gray-600">Политикой конфиденциальности</span>
      </p>

      {/* forgot password modal */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  )
}
