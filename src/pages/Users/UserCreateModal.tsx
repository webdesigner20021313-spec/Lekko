import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Eye, EyeOff, ChevronDown } from 'lucide-react'
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter,
} from '@/shared/ui-kit/Modal'
import { cn } from '@/shared/utils/utils'
import { useUsersStore } from '@/pages/Users/stores/useUsersStore'
import type { User, PharmacyAccess } from './types/users.types'
import { MOCK_PHARMACIES } from './mocks/users.mocks'

interface Props {
  open:      boolean
  onClose:   () => void
  editUser?: User | null
}

interface FormState {
  name:           string
  phone:          string
  email:          string
  login:          string
  password:       string
  roleId:         string
  isActive:       boolean
  avatar:         string
  pharmacyAccess: PharmacyAccess
}

const EMPTY: FormState = {
  name: '', phone: '', email: '',
  login: '', password: '', roleId: '', isActive: true, avatar: '',
  pharmacyAccess: { all: true, ids: [] },
}

type FieldError = Partial<Record<keyof FormState, string>>

export function UserCreateModal({ open, onClose, editUser }: Props) {
  const { t } = useTranslation()
  const { roles, addUser, updateUser } = useUsersStore()
  const [form,     setForm]     = useState<FormState>(EMPTY)
  const [errors,   setErrors]   = useState<FieldError>({})
  const [showPass, setShowPass] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isEdit = !!editUser

  useEffect(() => {
    if (!open) return
    setErrors({})
    setShowPass(false)
    if (editUser) {
      setForm({
        name:           editUser.name,
        phone:          editUser.phone,
        email:          editUser.email ?? '',
        login:          editUser.login,
        password:       editUser.password,
        roleId:         editUser.roleId ?? '',
        isActive:       editUser.isActive,
        avatar:         editUser.avatar ?? '',
        pharmacyAccess: editUser.pharmacyAccess ?? { all: true, ids: [] },
      })
    } else {
      setForm(EMPTY)
    }
  }, [open, editUser])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm((f) => ({ ...f, avatar: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  function set(field: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate(): FieldError {
    const e: FieldError = {}
    if (!form.name.trim())    e.name     = t('user_name_error')
    if (!form.phone.trim())   e.phone    = t('user_phone_error')
    if (!form.login.trim())   e.login    = t('user_login_error')
    if (!isEdit && !form.password.trim()) e.password = t('user_password_error')
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const payload: Omit<User, 'id' | 'createdAt'> = {
      name:           form.name.trim(),
      phone:          form.phone.trim(),
      email:          form.email.trim() || undefined,
      login:          form.login.trim(),
      password:       form.password || editUser?.password || '',
      roleId:         form.roleId || null,
      isActive:       form.isActive,
      avatar:         form.avatar || undefined,
      pharmacyAccess: form.pharmacyAccess,
    }

    if (isEdit) {
      updateUser(editUser!.id, payload)
    } else {
      addUser(payload)
    }
    onClose()
  }

  const initials = form.name.trim()
    ? form.name.trim().split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <ModalContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>{isEdit ? t('user_edit_title') : t('user_create_title')}</ModalTitle>
          <ModalDescription>{t('user_modal_desc')}</ModalDescription>
        </ModalHeader>

        <div className="flex flex-col gap-4 py-2">

          {/* Avatar + status */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative h-[130px] w-[130px] overflow-hidden rounded-full border-2 border-dashed border-gray-200 dark:border-gray-600 transition-colors hover:border-gray-400 dark:hover:border-gray-400"
            >
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-[#222222] text-lg font-semibold text-gray-400">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-4 w-4 text-white" />
                <span className="text-[10px] font-medium text-white">{t('user_photo')}</span>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            {isEdit && (
              <div className="flex w-full items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('user_status')}</p>
                <button
                  type="button"
                  onClick={() => set('isActive', !form.isActive)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                    form.isActive ? 'bg-gray-900 dark:bg-[#f1f1f1]' : 'bg-gray-200 dark:bg-gray-600'
                  )}
                >
                  <span className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200',
                    form.isActive ? 'translate-x-5 dark:bg-gray-900' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
            )}
          </div>

          {/* Row 1: Name + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('user_name_label')}</label>
              <input
                type="text"
                placeholder={t('user_name_placeholder')}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={cn(
                  'h-10 rounded-lg border px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#222222] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20',
                  errors.name ? 'border-red-300 focus:border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-gray-400'
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('user_role_label')}</label>
              <div className="relative">
                <select
                  value={form.roleId}
                  onChange={(e) => set('roleId', e.target.value)}
                  className={cn(
                    'h-10 w-full appearance-none rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#222222] pl-3 pr-8 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20',
                    form.roleId === '' ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
                  )}
                >
                  <option value="">{t('user_no_role')}</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Row 2: Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('user_phone_label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+998 90 000 00 00"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={cn(
                  'h-10 rounded-lg border px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#222222] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20',
                  errors.phone ? 'border-red-300 focus:border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-gray-400'
                )}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="h-10 rounded-lg border border-gray-200 dark:border-gray-600 px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#222222] placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20"
              />
            </div>
          </div>

          {/* Row 3: Login + Password */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('user_login_label')}</label>
              <input
                type="text"
                placeholder={t('user_login_label')}
                value={form.login}
                onChange={(e) => set('login', e.target.value)}
                className={cn(
                  'h-10 rounded-lg border px-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#222222] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20',
                  errors.login ? 'border-red-300 focus:border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-gray-400'
                )}
              />
              {errors.login && <p className="text-xs text-red-500">{errors.login}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('user_password_label')} {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={isEdit ? t('user_password_placeholder_edit') : t('user_password_placeholder')}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className={cn(
                    'h-10 w-full rounded-lg border px-3 pr-9 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#222222] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-400/20',
                    errors.password ? 'border-red-300 focus:border-red-400' : 'border-gray-200 dark:border-gray-600 focus:border-gray-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
          </div>

        </div>

        {/* Pharmacy access */}
        <div className="flex flex-col gap-3 border-t border-gray-100 dark:border-[#333333] pt-4">
          {/* Header: title + switch */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('user_pharmacies_title')}
            </p>
            <button
              type="button"
              onClick={() => setForm((f) => ({
                ...f,
                pharmacyAccess: { ...f.pharmacyAccess, all: !f.pharmacyAccess.all },
              }))}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors duration-200',
                !form.pharmacyAccess.all
                  ? 'border-gray-900 bg-gray-900 dark:border-[#f1f1f1] dark:bg-[#f1f1f1]'
                  : 'border-gray-300 bg-gray-200 dark:border-gray-600 dark:bg-gray-600'
              )}
            >
              <span className={cn(
                'inline-block h-3 w-3 rounded-full bg-white shadow transition-transform duration-200',
                !form.pharmacyAccess.all ? 'translate-x-4 dark:bg-gray-900' : 'translate-x-0.5'
              )} />
            </button>
          </div>

          {/* Pharmacy tags — visible when switch is OFF */}
          {!form.pharmacyAccess.all && (
            <div className="flex flex-wrap gap-2">
              {MOCK_PHARMACIES.map((ph) => {
                const selected = form.pharmacyAccess.ids.includes(ph.id)
                return (
                  <button
                    key={ph.id}
                    type="button"
                    onClick={() => setForm((f) => {
                      const ids = selected
                        ? f.pharmacyAccess.ids.filter((id) => id !== ph.id)
                        : [...f.pharmacyAccess.ids, ph.id]
                      return { ...f, pharmacyAccess: { ...f.pharmacyAccess, ids } }
                    })}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                      selected
                        ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                    )}
                  >
                    {ph.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <ModalFooter className="border-t border-gray-100 dark:border-[#333333] pt-4">
          <button
            onClick={onClose}
            className="h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#222222] px-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#333333]"
          >
            {t('confirm_cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-black dark:bg-[#f1f1f1] dark:text-gray-900 dark:hover:bg-[#e0e0e0]"
          >
            {isEdit ? t('confirm_save') : t('confirm_create')}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
