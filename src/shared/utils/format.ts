export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Форматирует дату ISO-строкой → DD.MM.YYYY.
 * Возвращает пустую строку для null/undefined/'' и невалидных значений
 * (вместо `Invalid time value` RangeError).
 */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("ru-RU").format(num);
}
