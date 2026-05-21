import type { Medicine } from '@/products/megaprice/pages/purchase/types/purchase.types'
import type { AutoSelectItem } from '@/products/megaprice/api/hooks'
import type { LocalResult } from './types'

/**
 * Маппинг ответа автоподбора (`/api/drugsearch/auto-select`) в LocalResult[]
 * для ResultsStep. Чистая функция — без хуков и сайд-эффектов.
 *
 *  - matched / filtered_out / no_offers приходят от бэка с полем `reason`;
 *  - medicine берём из исходного списка по drugId (чтобы сохранить имя/МНН/произв.),
 *    иначе синтезируем минимальную заглушку из offer;
 *  - mockMedicines (без drugId — не отправлялись на бэк) добавляем как no_offers.
 */
export function buildAutoSelectResults(
  apiResult: AutoSelectItem[] | undefined,
  medicineByDrugId: Map<number, Medicine>,
  mockMedicines: Medicine[],
): LocalResult[] {
  const apiRows: LocalResult[] = (apiResult ?? []).map((row) => ({
    medicine: medicineByDrugId.get(row.drugId) ?? ({
      id: String(row.drugId),
      drugId: row.drugId,
      name: row.offer?.drugName ?? `Drug ${row.drugId}`,
      mnn: '',
      manufacturer: '',
      country: '',
      isFavorite: false,
    } as Medicine),
    offer: row.offer,
    reason: row.reason,
    avgPrice: row.avgPrice,
  }))

  const mockRows: LocalResult[] = mockMedicines.map((m) => ({
    medicine: m,
    offer: null,
    reason: 'no_offers' as const,
  }))

  return [...apiRows, ...mockRows]
}
