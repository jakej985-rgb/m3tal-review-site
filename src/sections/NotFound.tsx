import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/Button'
import { navigate } from '@/lib/router'
import { IsoStack } from './IsoStack'
import { SiteNav } from './Landing'

/** 404 for unknown routes, both on the site and inside /app. */
export function NotFound({ inApp }: { inApp?: boolean }) {
  const body = (
    <div className="relative flex min-h-[70vh] flex-1 items-center overflow-hidden px-6 sm:px-12">
      <IsoStack className="absolute top-1/2 right-[-140px] h-[520px] w-[620px] -translate-y-1/2 opacity-60 max-md:opacity-25" />
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative max-w-lg">
        <p className="font-mono text-sm text-muted">TRG-404 · Status: Not found</p>
        <h1 className="mt-5 text-[48px] leading-[1.02] font-semibold tracking-[-0.045em] sm:text-[64px]">This page was closed as won’t fix.</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-muted">
          <span className="font-mono text-fg/90">{window.location.pathname}</span> doesn’t exist. It may have moved, or the link has a typo.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button variant="primary" size="lg" iconRight={<ArrowRight className="size-[18px]" />} onClick={() => navigate('/app')}>
            Go to issues
          </Button>
          {!inApp && (
            <Button variant="outline" size="lg" icon={<ArrowLeft className="size-[18px]" />} onClick={() => navigate('/')}>
              Home
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
  if (inApp) return <div className="flex h-full flex-col overflow-y-auto">{body}</div>
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="flex flex-1 flex-col">{body}</main>
    </div>
  )
}
