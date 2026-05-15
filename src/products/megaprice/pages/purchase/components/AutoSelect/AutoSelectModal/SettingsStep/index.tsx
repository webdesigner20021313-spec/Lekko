import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/utils'
import { inputCls, UZ_CITIES } from '../config'
import { Label } from '../Label'
import { TagInput } from '../TagInput'
import type { Settings, TagOption } from '../types'

/** Шаг 1 — настройка фильтров (город / дистр / производитель / отклонение цены). */
export function SettingsStep({
  s,
  setS,
  supplierOptions,
  manufacturerOptions,
}: {
  s: Settings
  setS: (next: Settings | ((prev: Settings) => Settings)) => void
  supplierOptions: TagOption[]
  manufacturerOptions: TagOption[]
}) {
  const { t } = useTranslation()

  function toggleCity(city: string) {
    setS(p => ({
      ...p,
      cityFilter: p.cityFilter.includes(city)
        ? p.cityFilter.filter(c => c !== city)
        : [...p.cityFilter, city],
    }))
  }

  return (
    <>
      {/* Город */}
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <Label
          onClear={() => setS(p => ({ ...p, cityFilter: [] }))}
          hasValue={s.cityFilter.length > 0}
        >
          {t('filter_city')}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {UZ_CITIES.map(city => {
            const active = s.cityFilter.includes(city)
            return (
              <button
                key={city}
                type="button"
                onClick={() => toggleCity(city)}
                className={cn(
                  'rounded-full border px-3 py-1 text-[13px] font-medium transition-colors duration-150',
                  active
                    ? 'border-gray-900 bg-gray-900 text-white dark:border-[#f1f1f1] dark:bg-[#f1f1f1] dark:text-gray-900'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#222222] dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700',
                )}
              >
                {city}
              </button>
            )
          })}
        </div>
      </div>

      {/* Дистрибутор */}
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <Label
          onClear={() => setS(p => ({ ...p, supplierIds: [] }))}
          hasValue={s.supplierIds.length > 0}
        >
          {t('filter_distributor')}
        </Label>
        <TagInput
          options={supplierOptions}
          selected={s.supplierIds}
          onAdd={id => setS(p => ({ ...p, supplierIds: p.supplierIds.includes(id) ? p.supplierIds : [...p.supplierIds, id] }))}
          onRemove={id => setS(p => ({ ...p, supplierIds: p.supplierIds.filter(x => x !== id) }))}
          placeholder={t('autoselect_find_distributor')}
        />
      </div>

      {/* Производитель */}
      <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <Label
          onClear={() => setS(p => ({ ...p, manufacturerNames: [] }))}
          hasValue={s.manufacturerNames.length > 0}
        >
          {t('filter_manufacturer')}
        </Label>
        <TagInput
          options={manufacturerOptions}
          selected={s.manufacturerNames}
          onAdd={name => setS(p => ({ ...p, manufacturerNames: p.manufacturerNames.includes(name) ? p.manufacturerNames : [...p.manufacturerNames, name] }))}
          onRemove={name => setS(p => ({ ...p, manufacturerNames: p.manufacturerNames.filter(x => x !== name) }))}
          placeholder={t('autoselect_find_manufacturer')}
        />
      </div>

      {/* Цена */}
      <div className="px-5 py-4">
        <Label
          onClear={() => setS(p => ({ ...p, priceDeviationPct: '' }))}
          hasValue={s.priceDeviationPct !== ''}
        >
          {t('autoselect_max_deviation')}
        </Label>
        <div className="relative">
          <input
            type="number"
            min={0}
            max={100}
            value={s.priceDeviationPct}
            onChange={e => setS(p => ({ ...p, priceDeviationPct: e.target.value }))}
            placeholder={t('autoselect_no_limit')}
            className={cn(inputCls, 'pr-8')}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
        </div>
      </div>
    </>
  )
}
