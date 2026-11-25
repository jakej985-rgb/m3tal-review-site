import { lazy, Suspense, useEffect } from 'react'

import { useLocation } from './lib/router'
import { Landing } from './sections/Landing'
import { NotFound } from './sections/NotFound'

const TrackerApp = lazy(() => import('./app/TrackerApp').then((m) => ({ default: m.TrackerApp })))
const StyleGuide = lazy(() => import('./styleguide/StyleGuide').then((m) => ({ default: m.StyleGuide })))

export function App() {
  const { pathname } = useLocation()

  // Warm the app chunk once the landing page is idle, so "Get started" is instant.
  useEffect(() => {
    const t = window.setTimeout(() => void import('./app/TrackerApp'), 1500)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (pathname === '/') document.title = 'Triage — Bug tracking for teams that ship fast'
    else if (pathname === '/styleguide') document.title = 'Style guide · Triage'
    else if (!pathname.startsWith('/app')) document.title = 'Not found · Triage'
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
