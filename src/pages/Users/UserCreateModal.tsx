import { useState, useEffect, useRef } from 'react'
import { Camera, Eye, EyeOff, ChevronDown } from 'lucide-react'
import {
  Modal, ModalContent, ModalHeader, ModalTitle,
  ModalDescription, ModalFooter,
} from '@/shared/ui-kit/Modal'
import { cn } from '@/shared/utils/utils'
import { useUsersStore } from '@/pages/Users/stores/useUsersStore'
import type { User } from './types/users.types'

interface Props {
  open:      boolean
  onClose:   () => void
  editUser?: User | null
}

interface FormState {
  name:     string
  phone:    string
  email:    string
  login:    string
  password: string
  roleId:   string
  isActive: boolean
  avatar:   string
}

const EMPTY: FormState = {
  name: '', phone: '', email: '',
  login: '', password: '', roleId: '', isActive: true, avatar: '',
}

type FieldError = Partial<Record<keyof FormState, string>>

export function UserCreateModal({ open, onClose, editUser }: Props) {
  const { roles, addUser, updateUser } = useUsersStore()
  const [form,        setForm]        = useState<FormState>(EMPTY)
  const [errors,      setErrors]      = useState<FieldError>({})
  const [showPass,    setShowPass]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isEdit = !!editUser

  useEffect(() => {
    if (!open) return
    setErrors({})
    setShowPass(false)
    if (editUser) {
      setForm({
        name:     editUser.name,
        phone:    editUser.phone,
        email:    editUser.email ?? '',
        login:    editUser.login,
        password: editUser.password,
        roleId:   editUser.roleId ?? '',
        isActive: editUser.isActive,
        avatar:   editUser.avatar ?? '',
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
    if (!form.name.trim())    e.name     = 'Введите имя и фамилию'
    if (!form.phone.trim())   e.phone    = 'Телефон обязателен'
    if (!form.login.trim())   e.login    = 'Введите логин'
    if (!isEdit && !form.password.trim()) e.password = 'Введите пароль'
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const payload: Omit<User, 'id' | 'createdAt'> = {
      name:     form.name.trim(),
      phone:    form.phone.trim(),
      email:    form.email.trim() || undefined,
      login:    form.login.trim(),
      password: form.password || editUser?.password || '',
      roleId:   form.roleId || null,
      isActive: form.isActive,
      avatar:   form.avatar || undefined,
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
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>{isEdit ? 'Редактировать пользователя' : 'Новый пользователь'}</ModalTitle>
          <ModalDescription>Заполните данные пользователя</ModalDescription>
        </ModalHeader>

        <div className="flex flex-col gap-4 py-2">

          {/* ── Фото + статус (edit only) ── */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative h-[130px] w-[130px] overflow-hidden rounded-full border-2 border-dashed border-gray-200 transition-colors hover:border-gray-400"
            >
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-50 text-lg font-semibold text-gray-400">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-4 w-4 text-white" />
                <span className="text-[10px] font-medium text-white">Фото</span>
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            {isEdit && (
              <div className="flex w-full items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Статус</p>
                <button
                  type="button"
                  onClick={() => set('isActive', !form.isActive)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
                    form.isActive ? 'bg-gray-900' : 'bg-gray-200'
                  )}
                >
                  <span className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200',
                    form.isActive ? 'translate-x-5' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
            )}
          </div>

          {/* ── Строка 1: Имя Фамилия + Роль ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Имя Фамилия</label>
              <input
                type="text"
                placeholder="Имя и фамилия"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={cn(
                  'h-10 rounded-lg border px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20',
                  errors.name ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Роль</label>
              <div className="relative">
                <select
                  value={form.roleId}
                  onChange={(e) => set('roleId', e.target.value)}
                  className={cn(
                    'h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20',
                    form.roleId === '' ? 'text-gray-400' : 'text-gray-900'
                  )}
                >
                  <option value="">Без роли</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* ── Строка 3: Телефон + Email ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Телефон <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+998 90 000 00 00"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={cn(
                  'h-10 rounded-lg border px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20',
                  errors.phone ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                )}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </div>
          </div>

          {/* ── Строка 4: Логин + Пароль ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Логин</label>
              <input
                type="text"
                placeholder="Логин"
                value={form.login}
                onChange={(e) => set('login', e.target.value)}
                className={cn(
                  'h-10 rounded-lg border px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20',
                  errors.login ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
                )}
              />
              {errors.login && <p className="text-xs text-red-500">{errors.login}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Пароль {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder={isEdit ? 'Оставьте пустым чтобы не менять' : 'Пароль'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className={cn(
                    'h-10 w-full rounded-lg border px-3 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20',
                    errors.password ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-gray-400'
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

        <ModalFooter>
          <button
            onClick={onClose}
            className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className="h-9 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            {isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
