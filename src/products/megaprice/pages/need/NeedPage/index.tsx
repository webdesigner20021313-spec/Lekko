import { PharmaPlusLock } from '@/products/megaprice/components/PharmaPlusLock'

// Раздел «Потребность» — премиум-функция (PharmaPlus). Полноэкранная заглушка.
// Прежняя реализация доступна в истории git, если фича будет открыта подпиской.
export function NeedPage() {
  return (
    <PharmaPlusLock
      feature="Потребность"
      perks={['Прогноз спроса по продажам', 'Рекомендованный объём заказа', 'AI-советы по закупке']}
    />
  )
}
