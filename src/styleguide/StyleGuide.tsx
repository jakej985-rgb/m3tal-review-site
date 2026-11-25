import { ArrowRight, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { type ReactNode, useEffect, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { Button, ButtonLink, type ButtonSize, type ButtonVariant } from '@/components/Button'
import { Drawer } from '@/components/Drawer'
import { DueBadge } from '@/components/DueBadge'
import { EmptyState } from '@/components/EmptyState'
import { Input, Textarea } from '@/components/Field'
import { IconButton } from '@/components/IconButton'
import { Kbd } from '@/components/Kbd'
import { Badge, LabelChip } from '@/components/LabelChip'
import { Logo, LogoMark } from '@/components/Logo'
import { Modal } from '@/components/Modal'
import { Picker } from '@/components/Picker'
import { PriorityIcon } from '@/components/PriorityIcon'
import { Panel, SectionHead, StatTile } from '@/components/Section'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Skeleton } from '@/components/Skeleton'
import { Spinner } from '@/components/Spinner'
import { StatusIcon } from '@/components/StatusIcon'
import { Switch } from '@/components/Switch'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ToastProvider, useToast } from '@/components/Toast'
import { ToolbarButton } from '@/components/ToolbarButton'
import { PRIORITIES, SEED_MEMBERS, STATUSES } from '@/data'
import { cn } from '@/lib/cn'
import { addDays, isoDay } from '@/lib/dates'
import { DUR, EASE } from '@/lib/motion'
import { Link } from '@/lib/router'
import { useTheme } from '@/lib/theme'
import { IsoStack } from '@/sections/IsoStack'
import { ProductMock } from '@/sections/ProductMock'

/*
  /styleguide — the design system, rendered by the real components. Every
  state shown is the component itself, pinned with `data-force` (see the
  custom variants in styles.css), not a screenshot or a copy.
*/

const NAV = [
  ['colour', 'Colour'],
  ['type', 'Type'],
  ['space', 'Spacing & radii'],
  ['elevation', 'Elevation'],
  ['motion', 'Motion'],
  ['button', 'Button'],
  ['icon-button', 'IconButton & Toolbar'],
  ['fields', 'Input & Textarea'],
  ['selection', 'Switch & Segmented'],
  ['chips', 'Badge, LabelChip, Kbd'],
  ['tracker-icons', 'Status, priority, due'],
  ['avatar', 'Avatar'],
  ['menus', 'Popover & SelectMenu'],
  ['overlays', 'Modal, Drawer, Toast'],
  ['feedback', 'Skeleton, Spinner, Empty'],
  ['layout', 'Panel, StatTile, Section'],
  ['brand', 'Logo, IsoStack, Mock'],
  ['themes', 'Both themes'],
] as const

const COLOR_TOKENS: [string, string, string][] = [
  ['bg', '--c-bg', 'Page'],
  ['surface', '--c-surface', 'Panels, list'],
  ['surface-2', '--c-surface-2', 'Hover, selected'],
  ['raised', '--c-raised', 'Popovers, toasts'],
  ['line', '--c-line', 'Hairlines'],
  ['line-strong', '--c-line-strong', 'Outlines, inputs'],
  ['fg', '--c-fg', 'Text'],
  ['muted', '--c-muted', 'Secondary text'],
  ['faint', '--c-faint', 'Placeholders, icons'],
  ['skel', '--c-skel', 'Skeleton bars'],
  ['invert', '--c-invert', 'Primary button'],
  ['invert-fg', '--c-invert-fg', 'On primary'],
]
const STATUS_TOKENS: [string, string][] = [
  ['backlog', '--c-backlog'],
  ['todo', '--c-todo'],
  ['progress', '--c-progress'],
  ['review', '--c-review'],
  ['blocked', '--c-blocked'],
  ['done', '--c-done'],
  ['canceled', '--c-canceled'],
  ['chart-open', '--c-chart-open'],
  ['chart-closed', '--c-chart-closed'],
]

function useCssVar(name: string) {
  const theme = useTheme()
  const [v, setV] = useState('')
  useEffect(() => {
    setV(getComputedStyle(document.documentElement).getPropertyValue(name).trim())
  }, [name, theme])
  return v
}

function Swatch({ name, cssVar, use }: { name: string; cssVar: string; use?: string }) {
  const hex = useCssVar(cssVar)
  return (
    <div className="border-r border-b border-line">
      <div className="h-16 border-b border-line" style={{ background: `var(${cssVar})` }} />
      <div className="p-3">
        <p className="text-[13px] font-medium">{name}</p>
        <p className="mt-0.5 font-mono text-[11px] text-muted">{hex}</p>
        {use && <p className="mt-1 text-xs text-muted">{use}</p>}
      </div>
    </div>
  )
}

function Block({ id, title, note, children }: { id: string; title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-line py-12">
      <h2 className="text-[24px] font-semibold tracking-[-0.03em]">{title}</h2>
      {note && <div className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{note}</div>}
      <div className="mt-8">{children}</div>
    </section>
  )
}

function Row({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className="grid gap-3 border-b border-line py-4 last:border-0 md:grid-cols-[150px_1fr] md:items-center">
      <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{label}</span>
      <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>
    </div>
  )
}

const TYPE = [
  ['Display', 'text-[60px] font-semibold tracking-[-0.04em] leading-[1.06]', '60 / 600 / -0.04em'],
  ['H1 app', 'text-[48px] font-semibold tracking-[-0.045em] leading-[1.02]', '48 / 600'],
  ['H2 section', 'text-[44px] font-semibold tracking-[-0.035em] leading-[1.05]', '44 / 600'],
  ['Stat', 'text-[34px] font-semibold tracking-[-0.04em] leading-none', '34 / 600'],
  ['H3 page', 'text-[24px] font-semibold tracking-[-0.03em]', '24 / 600'],
  ['Issue title', 'text-[20px] font-semibold tracking-[-0.02em]', '20 / 600'],
  ['Lead', 'text-[18px] text-muted leading-[1.65]', '18 / 400'],
  ['Card title', 'text-[17px] font-medium', '17 / 500'],
  ['Body', 'text-[15px]', '15 / 400'],
  ['UI', 'text-[13.5px]', '13.5 / 400'],
  ['Small', 'text-[13px] text-muted', '13 / 400'],
  ['Mono ID', 'font-mono text-[12px] text-muted', 'Geist Mono 12'],
  ['Eyebrow', 'font-mono text-[11px] tracking-[0.12em] uppercase text-muted', 'Mono 11 / caps'],
] as const

const SPACE = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24]

function MotionDemo({ name, dur, ease, css }: { name: string; dur: number; ease: readonly number[]; css: string }) {
  const [k, setK] = useState(0)
  return (
    <div className="border-r border-b border-line p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium">{name}</p>
        <IconButton label={`Replay ${name}`} size="sm" onClick={() => setK((x) => x + 1)}>
          <RotateCcw className="size-3.5" />
        </IconButton>
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted">{css}</p>
      <div className="relative mt-4 h-8 border border-line" style={{ containerType: 'inline-size' }}>
        <motion.span key={k} className="absolute top-1 left-1 size-6 bg-fg" initial={{ x: 0 }} animate={{ x: 'calc(100cqw - 34px)' }} transition={{ duration: dur, ease: ease as [number, number, number, number] }} />
      </div>
    </div>
  )
}

function ToastDemo() {
  const toast = useToast()
  return (
    <>
      <Button size="sm" onClick={() => toast({ title: 'TRG-142 moved to Done' })}>
        Show toast
      </Button>
      <Button size="sm" onClick={() => toast({ title: 'TRG-139 deleted', action: { label: 'Undo', run: () => toast({ title: 'Restored' }) } })}>
        Toast with Undo
      </Button>
    </>
  )
}

function ComponentSamples() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="sm">Primary</Button>
        <Button size="sm">Outline</Button>
        <Button variant="ghost" size="sm">Ghost</Button>
        <Button variant="danger" size="sm">Danger</Button>
      </div>
      <Input inputSize="sm" placeholder="Search issues" icon={<Search className="size-3.5" />} aria-label="Sample search" />
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => <StatusIcon key={s.id} status={s.id} />)}
        {PRIORITIES.map((p) => <PriorityIcon key={p.id} priority={p.id} />)}
        <LabelChip color="#f43f5e">Bug</LabelChip>
        <Badge>v2.4</Badge>
        <Avatar member={SEED_MEMBERS[1]} size="sm" />
      </div>
      <div className="hatch flex h-10 items-center gap-3 border border-line px-3 font-mono text-[12px] text-muted">
        <StatusIcon status="blocked" /> TRG-139 <Skeleton w={120} h={6} className="rounded-full" />
      </div>
    </div>
  )
}

export function StyleGuide() {
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [sw, setSw] = useState(true)
  const [seg, setSeg] = useState<'list' | 'board'>('list')
  const [status, setStatus] = useState<(typeof STATUSES)[number]['id']>('in_progress')
  const [labels, setLabels] = useState<string[]>(['bug'])
  const [field, setField] = useState('')
  const today = new Date()

  const variants: ButtonVariant[] = ['primary', 'outline', 'ghost', 'danger']
  const sizes: ButtonSize[] = ['sm', 'md', 'lg']

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-bg">
        <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-9">
            <Link to="/" aria-label="Triage home" className="py-2">
              <Logo />
            </Link>
            <span className="hidden font-mono text-xs text-muted sm:inline">/ style guide</span>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <ButtonLink to="/app" size="sm" variant="outline" iconRight={<ArrowRight className="size-3.5" />}>
                Open app
              </ButtonLink>
            </div>
          </div>
        </header>
        <div className="grid lg:grid-cols-[220px_1fr]">
          <nav aria-label="Style guide sections" className="hidden border-r border-line lg:block">
            <ul className="sticky top-16 flex max-h-[calc(100dvh-64px)] flex-col overflow-y-auto p-4">
              {NAV.map(([id, label]) => (
                <li key={id}>
                  <Link to={`/styleguide#${id}`} className="flex min-h-8 items-center px-2 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-fg">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <main className="min-w-0 px-4 pb-24 sm:px-9">
            <div className="py-14">
              <SectionHead
                eyebrow="Design system"
                title="Triage style guide"
                body="Near-black, square-cornered, hairline borders. Tokens live in src/styles.css; components in src/components/. Everything below is rendered by the components the app uses."
              />
            </div>

            <Block id="colour" title="Colour" note="Every colour is a CSS variable redefined per theme, read by Tailwind through @theme inline. Hex values below are live for the current theme.">
              <div className="grid grid-cols-2 border-t border-l border-line sm:grid-cols-3 xl:grid-cols-6">
                {COLOR_TOKENS.map(([n, v, u]) => (
                  <Swatch key={n} name={n} cssVar={v} use={u} />
                ))}
              </div>
              <p className="mt-8 mb-3 text-[13px] text-muted">Status and chart colours. Status colours always ship with an icon or label, never colour alone.</p>
              <div className="grid grid-cols-3 border-t border-l border-line sm:grid-cols-5 xl:grid-cols-9">
                {STATUS_TOKENS.map(([n, v]) => (
                  <Swatch key={n} name={n} cssVar={v} />
                ))}
              </div>
            </Block>

            <Block id="type" title="Type" note="Geist for UI and headlines, Geist Mono for IDs, dates, counts and eyebrows. Headlines run tight (negative tracking); body stays at 0.">
              <div className="border-t border-line">
                {TYPE.map(([name, cls, spec]) => (
                  <div key={name} className="grid gap-2 border-b border-line py-4 md:grid-cols-[150px_1fr_160px] md:items-baseline">
                    <span className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">{name}</span>
                    <span className={cn('truncate', cls)}>Bug tracking for teams</span>
                    <span className="font-mono text-[11px] text-muted md:text-right">{spec}</span>
                  </div>
                ))}
              </div>
            </Block>

            <Block id="space" title="Spacing & radii" note="Tailwind's 4px scale. Page gutter is 36px (16px on phones); list rows are 44px; controls 32 / 40 / 52px. Corners are square everywhere except the product-shot frame (--radius-frame: 14px) and avatars.">
              <div className="flex flex-col gap-2">
                {SPACE.map((n) => (
                  <div key={n} className="flex items-center gap-4">
                    <span className="w-16 font-mono text-[11px] text-muted">{n * 4}px</span>
                    <span className="h-3 bg-fg/70" style={{ width: n * 4 }} />
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-6">
                {[
                  ['0 (default)', 'rounded-none'],
                  ['frame 14px', 'rounded-frame'],
                  ['full (avatars)', 'rounded-full'],
                ].map(([n, c]) => (
                  <div key={n} className="flex flex-col items-center gap-2">
                    <span className={cn('size-20 border border-line-strong bg-surface', c)} />
                    <span className="font-mono text-[11px] text-muted">{n}</span>
                  </div>
                ))}
              </div>
            </Block>

            <Block id="elevation" title="Elevation" note="Flat by default: depth comes from surface steps and hairlines. Only floating layers cast a shadow.">
              <div className="grid gap-6 sm:grid-cols-4">
                {[
                  ['Flat', 'border border-line bg-surface', 'surface + line'],
                  ['Hatch', 'hatch border border-line-strong bg-surface-2', 'selected / drop target'],
                  ['Pop', 'border border-line-strong bg-raised shadow-pop', '--shadow-pop'],
                  ['Modal', 'border border-line-strong bg-surface shadow-modal', '--shadow-modal'],
                ].map(([n, c, t]) => (
                  <div key={n}>
                    <div className={cn('h-24', c)} />
                    <p className="mt-2 text-[13px]">{n}</p>
                    <p className="font-mono text-[11px] text-muted">{t}</p>
                  </div>
                ))}
              </div>
            </Block>

            <Block id="motion" title="Motion" note="Durations in src/lib/motion.ts (DUR) and easings (EASE). Everything quiet and short; the hero stack drifts slowly. prefers-reduced-motion stops all of it.">
              <div className="grid border-t border-l border-line sm:grid-cols-2 xl:grid-cols-4">
                <MotionDemo name="fast · out" dur={DUR.fast} ease={EASE.out} css="120ms cubic-bezier(.22,1,.36,1)" />
                <MotionDemo name="base · out" dur={DUR.base} ease={EASE.out} css="200ms cubic-bezier(.22,1,.36,1)" />
                <MotionDemo name="slow · snap" dur={DUR.slow} ease={EASE.snap} css="400ms cubic-bezier(.2,.9,.1,1)" />
                <MotionDemo name="hero · out" dur={DUR.hero} ease={EASE.out} css="800ms cubic-bezier(.22,1,.36,1)" />
              </div>
            </Block>

            <Block id="button" title="Button" note={<>Four variants, three sizes. <code className="font-mono text-fg">primary</code> is the light-grey square CTA from the hero; <code className="font-mono text-fg">outline</code> is “Sign up”. Use one primary per view. <code className="font-mono text-fg">ButtonLink</code> renders the same look as a router link.</>}>
              <Panel className="px-5">
                {variants.map((v) => (
                  <Row key={v} label={v}>
                    <Button variant={v}>Default</Button>
                    <Button variant={v} data-force="hover">Hover</Button>
                    <Button variant={v} data-force="focus">Focus</Button>
                    <Button variant={v} data-force="active">Pressed</Button>
                    <Button variant={v} disabled>Disabled</Button>
                    <Button variant={v} loading>Loading</Button>
                  </Row>
                ))}
                <Row label="sizes">
                  {sizes.map((s) => (
                    <Button key={s} size={s} variant="primary" iconRight={<ArrowRight className="size-4" />}>
                      Size {s}
                    </Button>
                  ))}
                </Row>
                <Row label="with icon">
                  <Button size="sm" variant="primary" icon={<Plus className="size-4" />}>New issue</Button>
                  <Button size="sm" variant="danger" icon={<Trash2 className="size-4" />}>Delete</Button>
                  <ButtonLink to="/app" size="sm">ButtonLink</ButtonLink>
                </Row>
              </Panel>
            </Block>

            <Block id="icon-button" title="IconButton & ToolbarButton" note="Icon-only buttons always take a label (accessible name + tooltip). ToolbarButton is the Filter / Display trigger; `active` shows a filter is applied.">
              <Panel className="px-5">
                <Row label="IconButton">
                  <IconButton label="Add"><Plus className="size-4" /></IconButton>
                  <IconButton label="Add hover" data-force="hover"><Plus className="size-4" /></IconButton>
                  <IconButton label="Add focus" data-force="focus"><Plus className="size-4" /></IconButton>
                  <IconButton label="Add active" active><Plus className="size-4" /></IconButton>
                  <IconButton label="Add disabled" disabled><Plus className="size-4" /></IconButton>
                  <IconButton label="Small" size="sm"><Plus className="size-4" /></IconButton>
                </Row>
                <Row label="ToolbarButton">
                  <ToolbarButton>Filter</ToolbarButton>
                  <ToolbarButton data-force="hover">Hover</ToolbarButton>
                  <ToolbarButton active>Active · 2</ToolbarButton>
                  <ToolbarButton disabled className="opacity-45">Disabled</ToolbarButton>
                </Row>
              </Panel>
            </Block>

            <Block id="fields" title="Input & Textarea" note="Hairline fields; focus brightens the border instead of a ring. Errors turn the border and message red and set aria-invalid.">
              <Panel className="grid gap-6 p-5 md:grid-cols-2">
                <Input label="Default" placeholder="Issue title" value={field} onChange={(e) => setField(e.target.value)} />
                <Input label="With icon" placeholder="Search" icon={<Search className="size-4" />} />
                <Input label="Focused" placeholder="Focused" data-force="focus" className="[&_input]:border-fg/70" />
                <Input label="Error" defaultValue="not-an-email" error="Enter a valid email address." />
                <Input label="Disabled" placeholder="Disabled" disabled />
                <Input label="Small" inputSize="sm" placeholder="Small" hint="Hint text sits under the field." />
                <Textarea label="Textarea" placeholder="Add a description…" className="md:col-span-2" />
              </Panel>
            </Block>

            <Block id="selection" title="Switch & SegmentedControl" note="Switch for binary settings. SegmentedControl for 2–4 exclusive views; arrow keys move between options, the thumb slides.">
              <Panel className="px-5">
                <Row label="Switch">
                  <Switch label="Demo on" checked={sw} onChange={setSw} />
                  <Switch label="Off" checked={false} onChange={() => {}} />
                  <Switch label="Disabled" checked disabled onChange={() => {}} />
                </Row>
                <Row label="Segmented">
                  <SegmentedControl label="View" value={seg} onChange={setSeg} options={[{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }]} />
                  <SegmentedControl label="View md" size="md" value={seg} onChange={setSeg} options={[{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }]} />
                </Row>
              </Panel>
            </Block>

            <Block id="chips" title="Badge, LabelChip, Kbd" note="LabelChip carries a colour swatch or any icon and can be removable (filters). Badge is the mono tag for versions and counts.">
              <Panel className="px-5">
                <Row label="LabelChip">
                  <LabelChip color="#f43f5e">Bug</LabelChip>
                  <LabelChip color="#3b82f6">Frontend</LabelChip>
                  <LabelChip icon={<StatusIcon status="todo" size={12} />} onRemove={() => {}}>Todo</LabelChip>
                </Row>
                <Row label="Badge">
                  <Badge>v2.3</Badge>
                  <Badge tone="solid">v2.4</Badge>
                  <Badge tone="accent">Save 20%</Badge>
                </Row>
                <Row label="Kbd">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                  <Kbd>C</Kbd>
                  <Kbd>esc</Kbd>
                </Row>
              </Panel>
            </Block>

            <Block id="tracker-icons" title="Status, priority, due" note="The reference's status square, a priority glyph (bars, or the dot from the hero mock) and a due date that turns amber within 3 days and red when overdue.">
              <Panel className="px-5">
                <Row label="StatusIcon">
                  {STATUSES.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-2 text-[13px]">
                      <StatusIcon status={s.id} /> {s.name}
                    </span>
                  ))}
                </Row>
                <Row label="Priority bars">
                  {PRIORITIES.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-2 text-[13px]">
                      <PriorityIcon priority={p.id} /> {p.name}
                    </span>
                  ))}
                </Row>
                <Row label="Priority dot">
                  {PRIORITIES.map((p) => <PriorityIcon key={p.id} priority={p.id} variant="dot" />)}
                </Row>
                <Row label="DueBadge">
                  <DueBadge due={isoDay(addDays(today, -2))} />
                  <DueBadge due={isoDay(addDays(today, 2))} />
                  <DueBadge due={isoDay(addDays(today, 12))} />
                </Row>
              </Panel>
            </Block>

            <Block id="avatar" title="Avatar" note="Generated SVG: a dark disc, a hue-tinted shape picked from the member id, initials from 22px up. null renders the dashed Unassigned glyph.">
              <Panel className="px-5">
                <Row label="sizes">
                  {(['xs', 'sm', 'md', 'lg'] as const).map((s) => <Avatar key={s} member={SEED_MEMBERS[0]} size={s} />)}
                </Row>
                <Row label="members">
                  {SEED_MEMBERS.map((m) => <Avatar key={m.id} member={m} size="md" />)}
                  <Avatar member={null} size="md" />
                </Row>
              </Panel>
            </Block>

            <Block id="menus" title="Popover & SelectMenu" note="Picker = trigger + Popover + SelectMenu. Type to filter, ↑↓ to move, Enter or 1–9 to pick. Single pickers close on choice; multi pickers stay open. Escape closes and returns focus.">
              <Panel className="px-5">
                <Row label="Single">
                  <Picker label="Status" options={STATUSES.map((s) => ({ value: s.id, label: s.name, icon: <StatusIcon status={s.id} /> }))} selected={[status]} onSelect={setStatus}>
                    {(p) => (
                      <Button size="sm" {...p} icon={<StatusIcon status={status} />}>
                        {STATUSES.find((s) => s.id === status)?.name}
                      </Button>
                    )}
                  </Picker>
                </Row>
                <Row label="Multi">
                  <Picker
                    label="Labels"
                    multi
                    options={[
                      { value: 'bug', label: 'Bug', icon: <span className="size-2.5 bg-[#f43f5e]" /> },
                      { value: 'fe', label: 'Frontend', icon: <span className="size-2.5 bg-[#3b82f6]" /> },
                      { value: 'be', label: 'Backend', icon: <span className="size-2.5 bg-[#14b8a6]" /> },
                    ]}
                    selected={labels}
                    onSelect={(v) => setLabels((xs) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]))}
                  >
                    {(p) => <ToolbarButton {...p} active={labels.length > 0}>Labels · {labels.length}</ToolbarButton>}
                  </Picker>
                </Row>
              </Panel>
            </Block>

            <Block id="overlays" title="Modal, Drawer, Toast" note="All overlays trap focus, close on Escape and scrim click, and restore focus to the opener. Nested overlays close innermost first.">
              <Panel className="px-5">
                <Row label="Open">
                  <Button size="sm" onClick={() => setModal(true)}>Open modal</Button>
                  <Button size="sm" onClick={() => setDrawer(true)}>Open drawer</Button>
                  <ToastDemo />
                </Row>
              </Panel>
              <Modal
                open={modal}
                onClose={() => setModal(false)}
                title="Example modal"
                footer={
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
                    <Button size="sm" variant="primary" onClick={() => setModal(false)}>Confirm</Button>
                  </>
                }
              >
                <div className="p-5 text-sm text-muted">Square, hairline, one primary action in the footer.</div>
              </Modal>
              <Drawer open={drawer} onClose={() => setDrawer(false)} title="Example drawer">
                <div className="flex h-12 items-center justify-between border-b border-line px-4">
                  <span className="text-sm font-medium">Example drawer</span>
                  <Button size="sm" variant="ghost" onClick={() => setDrawer(false)}>Close</Button>
                </div>
                <div className="p-4 text-sm text-muted">Used for issue details below 1180px and the mobile navigation.</div>
              </Drawer>
            </Block>

            <Block id="feedback" title="Skeleton, Spinner, EmptyState" note="Skeleton bars are the flat grey placeholders from the reference; `shimmer` adds a moving hatch for real loading.">
              <Panel className="px-5">
                <Row label="Skeleton">
                  <Skeleton w={160} className="rounded-full" />
                  <Skeleton w={90} h={10} />
                  <Skeleton w={180} h={10} shimmer />
                </Row>
                <Row label="Spinner">
                  <Spinner className="size-4" />
                  <Spinner className="size-6 text-muted" />
                </Row>
              </Panel>
              <Panel className="mt-4">
                <EmptyState title="No issues match" body="Try removing a filter or searching for something else." action={<Button size="sm" variant="primary" icon={<Plus className="size-4" />}>New issue</Button>} />
              </Panel>
            </Block>

            <Block id="layout" title="Panel, StatTile, SectionHead" note="Panel is the hairline box; give it a title for a header bar. StatTiles sit in a border-l/border-t grid so hairlines never double.">
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel as="section" title="Panel with title" actions={<Badge>actions</Badge>}>
                  <p className="text-sm text-muted">Body content.</p>
                </Panel>
                <div className="grid grid-cols-2 border-t border-l border-line">
                  <StatTile label="Open issues" value={17} sub="3 urgent" />
                  <StatTile label="Median time to close" value="4.2d" />
                </div>
              </div>
            </Block>

            <Block id="brand" title="Logo, IsoStack, ProductMock" note="IsoStack is a live SVG model (src/sections/IsoStack.tsx): change the slab sizes, count or hatch density there. ProductMock is the interactive skeleton product shot.">
              <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                <Panel className="flex flex-col gap-6 p-6">
                  <Logo />
                  <LogoMark className="size-10" />
                  <div className="h-72">
                    <IsoStack className="h-full w-full" />
                  </div>
                </Panel>
                <ProductMock className="rounded-frame border-b" />
              </div>
            </Block>

            <Block id="themes" title="Both themes" note="The same components under data-theme='dark' and data-theme='light'. Toggle the page theme with the moon in the header.">
              <div className="grid gap-4 md:grid-cols-2">
                {(['dark', 'light'] as const).map((t) => (
                  <div key={t} data-theme={t} className="border border-line bg-bg p-5 text-fg">
                    <p className="mb-4 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">{t}</p>
                    <ComponentSamples />
                  </div>
                ))}
              </div>
            </Block>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
