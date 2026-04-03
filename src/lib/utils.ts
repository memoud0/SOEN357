export const APP_STORAGE_KEY = 'momentum.v1'
export const APP_VERSION = 1

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function toTitleCase(value: string) {
  return value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function normalizeTagList(list: string[]) {
  return Array.from(new Set(list.map((item) => item.trim()).filter(Boolean)))
}

export function formatDate(dateLike?: string) {
  if (!dateLike) {
    return 'No sessions yet'
  }

  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateLike))
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function nowIso() {
  return new Date().toISOString()
}
