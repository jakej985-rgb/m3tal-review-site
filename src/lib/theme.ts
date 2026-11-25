import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'
const KEY = 'triage:theme'
const listeners = new Set<() => void>()

const read = (): Theme =>
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#fafafa' : '#0e0e10')
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* private mode: theme just won't persist */
  }
  listeners.forEach((fn) => fn())
}

export const toggleTheme = () => setTheme(read() === 'dark' ? 'light' : 'dark')

export function useTheme(): Theme {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    read,
    () => 'dark',
  )
}
