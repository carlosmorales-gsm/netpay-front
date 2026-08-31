export const CDMX_TIME_ZONE = 'America/Mexico_City'

/** Zona IANA del navegador (ej. America/Hermosillo). */
export function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export function browserUtcOffsetLabel(date = new Date()) {
  const offsetMin = -date.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const hours = String(Math.floor(abs / 60)).padStart(2, '0')
  const minutes = String(abs % 60).padStart(2, '0')
  return minutes === '00' ? `UTC${sign}${Number(hours)}` : `UTC${sign}${hours}:${minutes}`
}

export function formatLocalDateParts(value: string | Date | null | undefined) {
  if (!value) return { date: '—', time: '' }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return { date: '—', time: '' }
  const tz = browserTimeZone()
  return {
    date: date.toLocaleDateString('es-MX', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('es-MX', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

/** Fecha y hora en zona del navegador (sin repetir el offset). */
export function formatLocalDateTime(value: string | Date | null | undefined) {
  const { date, time } = formatLocalDateParts(value)
  return time ? `${date}, ${time}` : date
}
