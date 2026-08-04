export function getApiErrorMessage(e: unknown, fallback: string) {
  const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message
  return Array.isArray(msg) ? msg.join(', ') : msg || fallback
}
