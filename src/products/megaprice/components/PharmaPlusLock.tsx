import { Crown, Sparkles, Check, ArrowRight } from 'lucide-react'

/**
 * Премиум-заглушка: функция доступна только с подпиской PharmaPlus.
 * Белый фон, аккуратные анимации (появление + парящая иконка + shimmer на кнопке).
 */
export function PharmaPlusLock({
  feature,
  perks = ['Автоматический подбор', 'Аналитика спроса', 'Приоритетная поддержка'],
}: {
  feature?: string
  perks?: string[]
}) {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-white p-6 dark:bg-[#111111]">
      <div className="animate-fade-in-up w-full max-w-md text-center">
        {/* Парящая иконка */}
        <div className="lk-float mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
          <Crown className="h-10 w-10 text-white" />
        </div>

        {/* Бейдж PharmaPlus */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          <Sparkles className="h-3.5 w-3.5" /> PharmaPlus
        </span>

        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {feature ? `${feature} — премиум` : 'Премиум-функция'}
        </h2>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Чтобы воспользоваться данной функцией надо приобрести <span className="font-semibold text-amber-600 dark:text-amber-400">PharmaPlus</span>
        </p>

        {/* Перки */}
        {perks.length > 0 && (
          <ul className="mx-auto mt-6 flex max-w-xs flex-col gap-2 text-left">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <button
          className="lk-shimmer mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-amber-500/30 transition-transform hover:scale-[1.03] active:scale-95"
        >
          Приобрести PharmaPlus
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
