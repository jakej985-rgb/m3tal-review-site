import { lazy, Suspense, useEffect } from 'react'

import { bootstrapAuth } from './app/store'
import { BRAND } from './data'
import { useLocation } from './lib/router'
import { Landing } from './sections/Landing'
import { NotFound } from './sections/NotFound'

const TrackerApp = lazy(() => import('./app/TrackerApp').then((m) => ({ default: m.TrackerApp })))
const StyleGuide = lazy(() => import('./styleguide/StyleGuide').then((m) => ({ default: m.StyleGuide })))

export function App() {
  const { pathname } = useLocation()

  // One session read per page load: it decides whether the tracker shows the
  // browser-only demo or the workspace saved to the visitor's account.
  useEffect(() => {
    void bootstrapAuth()
  }, [])

  // Warm the app chunk once the landing page is idle, so "Get started" is instant.
  useEffect(() => {
    const t = window.setTimeout(() => void import('./app/TrackerApp'), 1500)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (pathname === '/') document.title = `${BRAND.name} — ${BRAND.tagline}`
    else if (pathname === '/styleguide') document.title = `Style guide · ${BRAND.name}`
    else if (!pathname.startsWith('/app')) document.title = `Not found · ${BRAND.name}`
  }, [pathname])

  if (pathname === '/') return <Landing />
  if (pathname === '/app' || pathname.startsWith('/app/'))
    return (
      <Suspense fallback={<div className="h-dvh bg-bg" />}>
        <TrackerApp />
      </Suspense>
    )
  if (pathname === '/styleguide')
    return (
      <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
        <StyleGuide />
      </Suspense>
    )
  return <NotFound />
}
