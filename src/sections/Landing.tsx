import { ArrowRight, Bell, ChartColumn, Check, Kanban, Keyboard, Layers, Repeat } from 'lucide-react'
import { motion, useScroll, useTransform } from 'motion/react'
import { type FormEvent, useRef, useState } from 'react'

import { Button, ButtonLink } from '@/components/Button'
import { Input } from '@/components/Field'
import { Badge } from '@/components/LabelChip'
import { Logo } from '@/components/Logo'
import { SectionHead } from '@/components/Section'
import { SegmentedControl } from '@/components/SegmentedControl'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  CHANGELOG,
  CHANGELOG_HEAD,
  CTA,
  FEATURES,
  FEATURES_HEAD,
  FOOTER,
  HERO,
  NAV,
  PLANS,
  PRICING_HEAD,
} from '@/data'
import { cn } from '@/lib/cn'
import { EASE } from '@/lib/motion'
import { Link, navigate } from '@/lib/router'
import { IsoStack } from './IsoStack'
import { ProductMock } from './ProductMock'

const GUTTER = 'px-4 sm:px-9'

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className={cn('flex h-16 items-center justify-between', GUTTER)}>
        <Link to="/" aria-label="Triage home" className="-ml-1 px-1 py-2">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <Link to="/app" className="hidden h-10 items-center px-3 text-[15px] text-muted transition-colors hover:text-fg sm:inline-flex">
            {NAV.login}
          </Link>
          <ButtonLink to="/app" variant="outline" className="h-10 px-[18px] text-[15px]">
            {NAV.signup}
          </ButtonLink>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const stackY = useTransform(scrollYProgress, [0, 1], [0, 120])
  return (
    <section ref={ref} className="relative overflow-hidden">
      <motion.div style={{ y: stackY }} className="absolute top-[-70px] right-[-120px] h-[482px] w-[534px] opacity-40 md:right-[-40px] md:opacity-70 lg:right-[9%] lg:opacity-100">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE.out, delay: 0.15 }} className="h-full w-full">
          <IsoStack className="h-full w-full" />
        </motion.div>
      </motion.div>
      <div className={cn('relative pt-[68px] pb-[56px] max-md:pt-14', GUTTER)}>
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="ml-0.5 text-[44px] leading-[1.06] font-semibold tracking-[-0.04em] sm:text-[52px] lg:text-[60px]"
        >
          {HERO.title.map((line) => (
            <motion.span
              key={line}
              className="inline sm:block"
              variants={{ hidden: { opacity: 0, y: 24, filter: 'blur(6px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE.out } } }}
            >
              {line}{' '}
            </motion.span>
          ))}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE.out }}
          className="mt-[30px] max-w-[470px] text-[18px] leading-[1.65] text-muted"
        >
          {HERO.body}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.38, ease: EASE.out }} className="mt-[46px]">
          <Button variant="primary" size="lg" className="h-[51px] w-[202px] px-0 text-[16px]" iconRight={<ArrowRight className="size-[18px]" strokeWidth={1.8} />} onClick={() => navigate('/app')}>
            {HERO.cta}
          </Button>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.5, ease: EASE.out }} className={GUTTER}>
        <ProductMock />
      </motion.div>
    </section>
  )
}

const ICONS = { keyboard: Keyboard, layers: Layers, kanban: Kanban, repeat: Repeat, chart: ChartColumn, bell: Bell }

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay, ease: EASE.out }} className={className}>
      {children}
    </motion.div>
  )
}

function Features() {
  return (
    <section id="features" className={cn('scroll-mt-16 border-t border-line py-24', GUTTER)}>
      <Reveal>
        <SectionHead eyebrow={FEATURES_HEAD.eyebrow} title={FEATURES_HEAD.title} body={FEATURES_HEAD.body} />
      </Reveal>
      <div className="mt-14 grid grid-cols-1 border-t border-l border-line sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => {
          const Icon = ICONS[f.icon]
          return (
            <Reveal key={f.title} delay={(i % 3) * 0.06} className="group relative border-r border-b border-line p-8">
              <div className="hatch pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
              <div className="relative">
                <span className="flex size-10 items-center justify-center border border-line-strong text-fg transition-transform duration-300 ease-out group-hover:-translate-y-0.5">
                  <Icon className="size-[18px]" strokeWidth={1.6} aria-hidden />
                </span>
                <h3 className="mt-8 text-[17px] font-medium tracking-[-0.01em]">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{f.body}</p>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

function Changelog() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setState('loading')
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(body.error ?? 'Something went wrong. Try again.')
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
      setState('idle')
    }
  }
  return (
    <section id="changelog" className={cn('scroll-mt-16 border-t border-line py-24', GUTTER)}>
      <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <SectionHead eyebrow={CHANGELOG_HEAD.eyebrow} title={CHANGELOG_HEAD.title} />
          <form onSubmit={submit} noValidate className="mt-10 max-w-md">
            <p className="mb-3 text-sm text-muted">{CHANGELOG_HEAD.subscribe}</p>
            {state === 'done' ? (
              <p className="flex h-10 items-center gap-2 border border-done/40 px-3 text-sm text-fg" role="status">
                <Check className="size-4 text-done" aria-hidden /> {CHANGELOG_HEAD.done}
              </p>
            ) : (
              <div className="flex items-start gap-2">
                <Input
                  type="email"
                  className="flex-1"
                  placeholder={CHANGELOG_HEAD.placeholder}
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  autoComplete="email"
                />
                <Button type="submit" variant="primary" loading={state === 'loading'}>
                  {CHANGELOG_HEAD.button}
                </Button>
              </div>
            )}
          </form>
        </Reveal>
        <ol className="relative border-l border-line">
          {CHANGELOG.map((c, i) => (
            <motion.li
              key={c.version}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: EASE.out }}
              className="relative pb-10 pl-8 last:pb-0"
            >
              <span className="absolute top-1.5 -left-[5px] size-[9px] border border-line-strong bg-bg" aria-hidden />
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={i === 0 ? 'solid' : 'default'}>v{c.version}</Badge>
                <span className="font-mono text-xs text-muted">{c.date}</span>
              </div>
              <h3 className="mt-3 text-[19px] font-medium tracking-[-0.015em]">{c.title}</h3>
              <ul className="mt-3 flex flex-col gap-1.5">
                {c.items.map((it) => (
                  <li key={it} className="flex gap-2.5 text-[15px] text-muted">
                    <span className="mt-[11px] h-px w-3 shrink-0 bg-line-strong" aria-hidden />
                    {it}
                  </li>
                ))}
              </ul>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Pricing() {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('annual')
  return (
    <section id="pricing" className={cn('scroll-mt-16 border-t border-line py-24', GUTTER)}>
      <Reveal>
        <SectionHead eyebrow={PRICING_HEAD.eyebrow} title={PRICING_HEAD.title}>
          <div className="flex items-center gap-3">
            <SegmentedControl
              label="Billing period"
              size="md"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'monthly', label: PRICING_HEAD.monthly },
                { value: 'annual', label: PRICING_HEAD.annual },
              ]}
            />
            <Badge tone="accent">{PRICING_HEAD.save}</Badge>
          </div>
        </SectionHead>
      </Reveal>
      <div className="mt-14 grid grid-cols-1 border-t border-l border-line md:grid-cols-3">
        {PLANS.map((p, i) => {
          const price = p.monthly === null ? null : period === 'annual' ? Math.round(p.monthly * 0.8) : p.monthly
          return (
            <Reveal key={p.name} delay={i * 0.06} className={cn('relative flex flex-col border-r border-b border-line p-8', p.featured && 'bg-surface')}>
              {p.featured && <div className="hatch pointer-events-none absolute inset-x-0 top-0 h-24" aria-hidden />}
              <div className="relative flex items-center justify-between">
                <h3 className="text-[17px] font-medium">{p.name}</h3>
                {p.featured && <Badge tone="solid">Popular</Badge>}
              </div>
              <div className="relative mt-6 flex h-14 items-end gap-1.5">
                {price === null ? (
                  <span className="text-[40px] leading-none font-semibold tracking-[-0.04em]">Custom</span>
                ) : (
                  <>
                    <motion.span key={price} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[48px] leading-none font-semibold tracking-[-0.05em]">
                      ${price}
                    </motion.span>
                    <span className="pb-1 text-sm text-muted">/ member / mo</span>
                  </>
                )}
              </div>
              <p className="mt-4 text-[15px] text-muted">{p.blurb}</p>
              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[15px]">
                    <Check className="size-4 text-muted" strokeWidth={1.8} aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={p.featured ? 'primary' : 'outline'}
                className="mt-10 w-full"
                iconRight={<ArrowRight className="size-4" />}
                onClick={() => (p.monthly === null ? (window.location.href = 'mailto:sales@example.com') : navigate('/app'))}
              >
                {p.cta}
              </Button>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className={cn('relative overflow-hidden border-t border-line py-28', GUTTER)}>
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <Reveal className="relative flex flex-col items-center text-center">
        <h2 className="text-[40px] leading-[1.02] font-semibold tracking-[-0.045em] text-balance sm:text-[56px]">{CTA.title}</h2>
        <p className="mt-5 text-[17px] text-muted">{CTA.body}</p>
        <Button variant="primary" size="lg" className="mt-10" iconRight={<ArrowRight className="size-[18px]" />} onClick={() => navigate('/app')}>
          {CTA.button}
        </Button>
      </Reveal>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className={cn('border-t border-line pt-16 pb-10', GUTTER)}>
      <div className="grid gap-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">{FOOTER.blurb}</p>
        </div>
        {FOOTER.columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">{col.title}</p>
            <ul className="mt-4 flex flex-col">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  {href.startsWith('/api') ? (
                    <a href={href} className="inline-flex min-h-10 items-center text-sm text-muted transition-colors hover:text-fg">
                      {label}
                    </a>
                  ) : (
                    <Link to={href} className="inline-flex min-h-10 items-center text-sm text-muted transition-colors hover:text-fg">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 font-mono text-xs text-muted">
        <span>{FOOTER.legal}</span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 bg-done" aria-hidden /> All systems operational
        </span>
      </div>
    </footer>
  )
}

export function Landing() {
  return (
    <div className="min-h-dvh bg-bg">
      <SiteNav />
      <main>
        <Hero />
        <Features />
        <Changelog />
        <Pricing />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
