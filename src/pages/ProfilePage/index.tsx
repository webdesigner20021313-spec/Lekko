import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User as UserIcon, Mail, Phone, Globe, Moon, Sun,
  Building2, MapPin, FileText, Save, Loader2,
} from 'lucide-react'
import { cn } from '@/shared/utils/utils'
import { useAuthStore } from '@/shared/auth/useAuthStore'
import { useUIStore } from '@/shared/stores/useUIStore'
import { useQueryApiClient } from '@/shared/api/useQueryApiClient'
import { useUpdateProfile, useDrugStoreSettings } from '@/products/megaprice/api/hooks'
import { useToast } from '@/shared/ui-kit/Toaster'
import { Button } from '@/shared/ui-kit/Button'
import { SecuritySection } from './SecuritySection'

/**
 * Профиль — единая страница с двумя табами:
 *   1) Личное   — данные user + переключатели языка/темы + (заглушки безопасности)
 *   2) Аптека   — реквизиты drug_store (GET + PUT /api/drugstores/{id})
 *
 * Иммутабельные поля (email пользователя, ID, companyId, license) — read-only.
 */

interface DrugStoreEntity {
  id: number
  name: string
  nameRu?: string | null
  nameUz?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  additionalContacts?: string | null
  workContact?: string | null
  comments?: string | null
  companyId: number
  categoryId: number
  distributorId?: number | null
  licenseExpiryDate?: string | null
  areaId?: number | null
  statusId?: number | null
  isMainStorage: boolean
  showAllInfo?: boolean | null
}

type Tab = 'personal' | 'pharmacy'

export function ProfilePage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('personal')

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white px-4 py-6 md:px-8 dark:bg-[#111111]">
      <div className="mx-auto w-full max-w-3xl">

        <header className="border-b border-gray-200 pb-4 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('profile_title', { defaultValue: 'Профиль' })}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-[#929292]">
            {t('profile_subtitle_combined', { defaultValue: 'Личные данные и настройки аптеки' })}
          </p>
        </header>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 border-b border-gray-200 dark:border-gray-700">
          <TabBtn active={tab === 'personal'} onClick={() => setTab('personal')} icon={<UserIcon className="h-4 w-4" />}>
            {t('profile_tab_personal', { defaultValue: 'Личное' })}
          </TabBtn>
          <TabBtn active={tab === 'pharmacy'} onClick={() => setTab('pharmacy')} icon={<Building2 className="h-4 w-4" />}>
            {t('profile_tab_pharmacy', { defaultValue: 'Аптека' })}
          </TabBtn>
        </div>

        <div className="mt-6">
          {tab === 'personal' ? <PersonalTab /> : <PharmacyTab />}
        </div>

      </div>
    </div>
  )
}

// ── Personal tab ───────────────────────────────────────────────────────────

function PersonalTab() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const { language, setLanguage, theme, setTheme } = useUIStore()
  const { toast } = useToast()

  // Email + phone — единственные редактируемые поля. Login/full_name/role —
  // меняются только админом. Аптека вообще не в личной информации.
  const [emailDraft, setEmailDraft] = useState('')
  const [phoneDraft, setPhoneDraft] = useState('')
  useEffect(() => {
    setEmailDraft(user?.email ?? '')
    setPhoneDraft(user?.phone ?? '')
  }, [user?.email, user?.phone])

  const emailDirty = emailDraft.trim() !== (user?.email ?? '').trim()
  const phoneDirty = phoneDraft.trim() !== (user?.phone ?? '').trim()
  const anyDirty = emailDirty || phoneDirty

  const updateApi = useUpdateProfile()

  function handleSave() {
    if (!anyDirty) return
    updateApi.appendData(
      {
        email: emailDirty ? emailDraft.trim() : undefined,
        phone: phoneDirty ? phoneDraft.trim() : undefined,
      },
      undefined,
      () => {
        toast({
          title: t('profile_saved', { defaultValue: 'Сохранено' }),
          description: t('profile_saved_desc', { defaultValue: 'Личные данные обновлены' }),
          variant: 'success',
        })
        void bootstrap() // обновим useAuthStore.user
      },
    )
  }
  function handleRevert() {
    setEmailDraft(user?.email ?? '')
    setPhoneDraft(user?.phone ?? '')
  }

  if (!user) {
    return <div className="py-12 text-center text-gray-500">{t('common_loading', { defaultValue: 'Загрузка…' })}</div>
  }

  return (
    <div className="space-y-6">
      <Section icon={<UserIcon className="h-5 w-5" />} title={t('profile_section_personal', { defaultValue: 'Личные данные' })}>
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField
            label={t('profile_field_login', { defaultValue: 'Логин' })}
            value={user.login}
            badge={t('field_immutable', { defaultValue: 'нельзя изменить' })}
          />
          <ReadOnlyField label={t('profile_field_full_name', { defaultValue: 'Имя' })} value={user.fullName ?? '—'} />
          <ReadOnlyField
            label={t('profile_field_role', { defaultValue: 'Роль' })}
            value={user.roles.join(', ') || '—'}
            badge={t('field_immutable', { defaultValue: 'нельзя изменить' })}
          />
          {/* Email + phone — editable */}
          <EditField
            label={t('profile_field_email', { defaultValue: 'Email' })}
            value={emailDraft}
            onChange={setEmailDraft}
            icon={<Mail className="h-4 w-4" />}
          />
          <EditField
            label={t('profile_field_phone', { defaultValue: 'Телефон' })}
            value={phoneDraft}
            onChange={setPhoneDraft}
            icon={<Phone className="h-4 w-4" />}
          />
        </div>

        {anyDirty && (
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-[#333333]">
            <Button variant="outline" onClick={handleRevert} disabled={updateApi.isLoading}>
              {t('settings_revert', { defaultValue: 'Отменить' })}
            </Button>
            <Button onClick={handleSave} disabled={updateApi.isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {t('settings_save', { defaultValue: 'Сохранить' })}
            </Button>
          </div>
        )}
      </Section>

      <Section icon={<Globe className="h-5 w-5" />} title={t('profile_section_prefs', { defaultValue: 'Предпочтения' })}>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile_pref_language', { defaultValue: 'Язык' })}
            </p>
            <div className="flex gap-2">
              {(['ru', 'uz'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    language === lang
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-300',
                  )}
                >
                  {lang === 'ru' ? 'Русский' : 'O\'zbek'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile_pref_theme', { defaultValue: 'Тема' })}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  theme === 'light'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                )}
              >
                <Sun className="h-4 w-4" />
                {t('profile_theme_light', { defaultValue: 'Светлая' })}
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  theme === 'dark'
                    ? 'border-[#f1f1f1] bg-[#f1f1f1] text-gray-900'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-300',
                )}
              >
                <Moon className="h-4 w-4" />
                {t('profile_theme_dark', { defaultValue: 'Тёмная' })}
              </button>
            </div>
          </div>
        </div>
      </Section>

      <SecuritySection />
    </div>
  )
}

// ── Pharmacy tab ───────────────────────────────────────────────────────────

function PharmacyTab() {
  const { t } = useTranslation()
  const drugStoreId = useAuthStore((s) => s.drugStore?.drugStoreId ?? null)

  // Аптека — только просмотр. Менять реквизиты — отдельный admin flow.
  const dsApi = useQueryApiClient<DrugStoreEntity>({
    request: { url: `/api/drugstores/${drugStoreId ?? 0}`, method: 'GET' },
    enabled: !!drugStoreId,
  })
  // drug_store_settings — официальные реквизиты, INN, MFO, банк, лицензии.
  const settingsApi = useDrugStoreSettings(drugStoreId)

  if (!drugStoreId) {
    return <div className="py-12 text-center text-gray-500">
      {t('settings_no_drug_store', { defaultValue: 'У вашего аккаунта нет привязки к аптеке' })}
    </div>
  }

  if (dsApi.isLoading || !dsApi.data || !('id' in dsApi.data)) {
    return <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      {t('common_loading', { defaultValue: 'Загрузка…' })}
    </div>
  }

  const ds = dsApi.data

  return (
    <div className="space-y-6">
      <Section icon={<Building2 className="h-5 w-5" />} title={t('settings_section_main', { defaultValue: 'Реквизиты аптеки' })}>
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label={t('settings_field_name', { defaultValue: 'Название (RU)' })} value={ds.name ?? '—'} />
          <ReadOnlyField label={t('settings_field_name_uz', { defaultValue: 'Название (UZ)' })} value={ds.nameUz ?? '—'} />
          <ReadOnlyField
            label={t('settings_field_address', { defaultValue: 'Адрес' })}
            value={ds.address ?? '—'}
            icon={<MapPin className="h-4 w-4" />}
          />
          <ReadOnlyField
            label={t('settings_field_phone', { defaultValue: 'Телефон' })}
            value={ds.phone ?? '—'}
            icon={<Phone className="h-4 w-4" />}
          />
          <ReadOnlyField
            label={t('settings_field_email', { defaultValue: 'Email' })}
            value={ds.email ?? '—'}
            icon={<Mail className="h-4 w-4" />}
          />
          <ReadOnlyField
            label={t('settings_field_additional', { defaultValue: 'Доп. контакты' })}
            value={ds.additionalContacts ?? '—'}
          />
        </div>
        <p className="mt-4 text-xs text-gray-400">
          {t('pharmacy_readonly_note', { defaultValue: 'Реквизиты аптеки изменяются администратором — обратитесь в поддержку.' })}
        </p>
      </Section>

      {/* drug_store_settings — юридические реквизиты + лицензии */}
      {settingsApi.data && 'drugStoreId' in settingsApi.data && (
        <PharmacySettingsSection settings={settingsApi.data} />
      )}
    </div>
  )
}

function PharmacySettingsSection({ settings: s }: { settings: import('@/products/megaprice/api/hooks').DrugStoreSettingsDto }) {
  const { t } = useTranslation()
  const fmtDate = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString('ru-RU') : '—'
  return (
    <>
      <Section icon={<FileText className="h-5 w-5" />} title={t('pharmacy_legal_title', { defaultValue: 'Юридические данные' })}>
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label={t('pharmacy_company_name', { defaultValue: 'Официальное название' })} value={s.oficialcompanyname ?? '—'} />
          <ReadOnlyField label={t('pharmacy_company_address', { defaultValue: 'Юр. адрес' })} value={s.oficialcompanyaddress ?? '—'} />
          <ReadOnlyField label="ИНН" value={s.inn ?? '—'} />
          <ReadOnlyField label="МФО" value={s.mfo ?? '—'} />
          <ReadOnlyField label="ОКЭД" value={s.oked ?? '—'} />
          <ReadOnlyField label="ОКОНХ" value={s.okonh ?? '—'} />
          <ReadOnlyField label={t('pharmacy_nds_reg', { defaultValue: 'НДС рег. №' })} value={s.ndsRegNum ?? '—'} />
          <ReadOnlyField label={t('pharmacy_company_phones', { defaultValue: 'Телефоны компании' })} value={s.companyphones ?? '—'} />
        </div>
      </Section>

      <Section icon={<Building2 className="h-5 w-5" />} title={t('pharmacy_bank_title', { defaultValue: 'Банковские реквизиты' })}>
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label={t('pharmacy_bank_account', { defaultValue: 'Расчётный счёт' })} value={s.companybankaccount ?? '—'} />
          <ReadOnlyField label={t('pharmacy_bank_name', { defaultValue: 'Банк' })} value={s.companybankname ?? '—'} />
          <ReadOnlyField label={t('pharmacy_payment_card', { defaultValue: 'Карта оплаты' })} value={s.paymentCardNo ?? '—'} />
          <ReadOnlyField label={t('pharmacy_payment_card_user', { defaultValue: 'Держатель карты' })} value={s.paymentCardUserName ?? '—'} />
        </div>
      </Section>

      <Section icon={<FileText className="h-5 w-5" />} title={t('pharmacy_licenses_title', { defaultValue: 'Лицензии' })}>
        <div className="grid gap-4 md:grid-cols-3">
          <ReadOnlyField label={t('pharmacy_lic_gnk', { defaultValue: 'ГНК до' })} value={fmtDate(s.gnkLicenseDate)} />
          <ReadOnlyField label={t('pharmacy_lic_referent', { defaultValue: 'Референтные цены до' })} value={fmtDate(s.referentPricesLicenseDate)} />
          <ReadOnlyField label={t('pharmacy_lic_kerio', { defaultValue: 'Kerio до' })} value={fmtDate(s.kerioLicenseDate)} />
        </div>
      </Section>
    </>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-gray-900 text-gray-900 dark:border-[#f1f1f1] dark:text-gray-100'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-[#1a1a1a]">
      <div className="mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
        {icon}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ReadOnlyField({ label, value, icon, badge }: { label: string; value: string; icon?: React.ReactNode; badge?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500 dark:text-[#929292]">{label}</p>
        {badge && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:bg-[#222222] dark:text-gray-400">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-300">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="truncate">{value}</span>
      </div>
    </div>
  )
}

function EditField({
  label, value, onChange, icon, className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs text-gray-500 dark:text-[#929292]">{label}</label>
      <div className={cn(
        'flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 transition-colors',
        'focus-within:border-gray-400 dark:border-gray-700 dark:bg-[#222222]',
      )}>
        {icon && <span className="text-gray-400">{icon}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
        />
      </div>
    </div>
  )
}

