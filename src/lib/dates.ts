export const DAY = 86_400_000

export const isoDay = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const parseDay = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const shortDate = (s: string) => {
  const d = parseDay(s)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function dueTone(s: string | null): 'overdue' | 'soon' | 'later' | 'none' {
  if (!s) return 'none'
  const today = parseDay(isoDay(new Date())).getTime()
  const t = parseDay(s).getTime()
  if (t < today) return 'overdue'
  if (t - today <= 3 * DAY) return 'soon'
  return 'later'
}

export function ago(ts: number) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return `${Math.round(d / 30)}mo ago`
}
