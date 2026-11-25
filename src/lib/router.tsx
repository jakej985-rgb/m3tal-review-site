import { type AnchorHTMLAttributes, type MouseEvent, useSyncExternalStore } from 'react'

// A tiny history router: no dependency, pushState + a popstate listener.
// Routes are matched in App.tsx with plain string checks.

const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  listeners.add(fn)
  window.addEventListener('popstate', fn)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('popstate', fn)
  }
}

const getHref = () => window.location.pathname + window.location.search

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === getHref()) return
  if (opts.replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  listeners.forEach((fn) => fn())
  if (!opts.replace && !to.includes('?')) window.scrollTo(0, 0)
}

export function useLocation() {
  const href = useSyncExternalStore(subscribe, getHref, () => '/')
  const url = new URL(href, 'http://x')
  return { pathname: url.pathname.replace(/\/+$/, '') || '/', search: url.searchParams }
}

export function setQuery(key: string, value: string | null) {
  const url = new URL(window.location.href)
  if (value === null) url.searchParams.delete(key)
  else url.searchParams.set(key, value)
  navigate(url.pathname + url.search, { replace: true })
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

export function Link({ to, onClick, ...rest }: LinkProps) {
  const external = /^(https?:|mailto:)/.test(to) || to.startsWith('#')
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || external) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    const [path, hash] = to.split('#')
    if (hash) {
      if ((path || '/') !== window.location.pathname) navigate(path || '/')
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }))
      return
    }
    navigate(to)
  }
  return <a href={to} onClick={handle} {...rest} />
}
