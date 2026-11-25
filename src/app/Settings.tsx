import { Check, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type FormEvent, useRef, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { Input } from '@/components/Field'
import { IconButton } from '@/components/IconButton'
import { Popover } from '@/components/Popover'
import { Panel } from '@/components/Section'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Switch } from '@/components/Switch'
import { useToast } from '@/components/Toast'
import { LABEL_COLORS, type Label } from '@/data'
import { cn } from '@/lib/cn'
import { setTheme, useTheme } from '@/lib/theme'
import { PageHeader } from './IssuesView'
import { addLabel, addMember, getState, patchLabel, removeLabel, removeMember, renameWorkspace, resetDemo, useStore } from './store'

type Tab = 'general' | 'labels' | 'members'

function ColorSwatch({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button ref={anchor} type="button" aria-label="Change colour" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex size-8 shrink-0 items-center justify-center border border-line hover:border-line-strong">
        <span className="size-3" style={{ background: value }} />
      </button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} width={196} label="Label colour">
        <div className="grid grid-cols-4 gap-1.5 p-2.5">
          {LABEL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Colour ${c}`}
              aria-pressed={c === value}
              onClick={() => {
                onChange(c)
                setOpen(false)
              }}
              className="flex size-10 items-center justify-center border border-line hover:border-line-strong"
            >
              <span className="flex size-5 items-center justify-center" style={{ background: c }}>
                {c === value && <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden />}
              </span>
            </button>
          ))}
        </div>
      </Popover>
    </>
  )
}

function LabelRow({ label, count }: { label: Label; count: number }) {
  const [name, setName] = useState(label.name)
  const toast = useToast()
  return (
    <motion.li layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 border-b border-line px-4 py-2 last:border-0">
      <ColorSwatch value={label.color} onChange={(color) => patchLabel(label.id, { color })} />
      <Input
        inputSize="sm"
        aria-label={`Label name for ${label.name}`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const t = name.trim()
          if (!t) setName(label.name)
          else if (t !== label.name) {
            patchLabel(label.id, { name: t })
            toast({ title: `Renamed to ${t}` })
          }
        }}
        className="flex-1 [&_input]:border-transparent [&_input]:hover:border-line"
      />
      <span className="w-20 text-right font-mono text-[11px] text-muted">{count} issues</span>
      <IconButton
        label={`Delete label ${label.name}`}
        size="sm"
        onClick={() => {
          removeLabel(label.id)
          toast({ title: `Label ${label.name} deleted`, action: { label: 'Undo', run: () => addLabel(label.name, label.color) } })
        }}
      >
        <Trash2 className="size-4" />
      </IconButton>
    </motion.li>
  )
}

function Labels() {
  const labels = useStore((s) => s.labels)
  const issues = useStore((s) => s.issues)
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(LABEL_COLORS[5])
  const [error, setError] = useState<string | null>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const t = name.trim()
    if (!t) return setError('Name the label.')
    if (labels.some((l) => l.name.toLowerCase() === t.toLowerCase())) return setError('A label with that name exists.')
    addLabel(t, color)
    setName('')
    setError(null)
  }
  return (
    <Panel>
      <form onSubmit={submit} className="flex items-start gap-2 border-b border-line p-4">
        <ColorSwatch value={color} onChange={setColor} />
        <Input
          inputSize="sm"
          className="flex-1"
          placeholder="New label name"
          aria-label="New label name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          error={error}
        />
        <Button type="submit" size="sm" variant="primary" icon={<Plus className="size-4" />}>
          Add label
        </Button>
      </form>
      {labels.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">No labels yet.</p>
      ) : (
        <ul>
          <AnimatePresence initial={false}>
            {labels.map((l) => (
              <LabelRow key={l.id} label={l} count={issues.filter((i) => i.labelIds.includes(l.id)).length} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Panel>
  )
}

function Members() {
  const members = useStore((s) => s.members)
  const issues = useStore((s) => s.issues)
  const meId = useStore((s) => s.meId)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const t = name.trim()
    if (t.length < 2) return setError('Enter a name.')
    addMember(t)
    toast({ title: `${t} added to the workspace` })
    setName('')
    setError(null)
  }
  return (
    <Panel>
      <form onSubmit={submit} className="flex items-start gap-2 border-b border-line p-4">
        <Input
          inputSize="sm"
          className="flex-1"
          placeholder="Full name, e.g. Ada Lovelace"
          aria-label="New member name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          error={error}
        />
        <Button type="submit" size="sm" variant="primary" icon={<Plus className="size-4" />}>
          Add member
        </Button>
      </form>
      <ul>
        <AnimatePresence initial={false}>
          {members.map((m) => (
            <motion.li key={m.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
              <Avatar member={m} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px]">
                  {m.name} {m.id === meId && <span className="ml-1 font-mono text-[11px] text-muted">you</span>}
                </p>
                <p className="font-mono text-[11px] text-muted">@{m.handle}</p>
              </div>
              <span className="hidden font-mono text-[11px] text-muted sm:block">{issues.filter((i) => i.assigneeId === m.id && !['done', 'canceled'].includes(i.status)).length} open</span>
              <IconButton
                label={`Remove ${m.name}`}
                size="sm"
                disabled={m.id === meId}
                onClick={() => {
                  removeMember(m.id)
                  toast({ title: `${m.name} removed. Their issues are now unassigned.` })
                }}
              >
                <Trash2 className="size-4" />
              </IconButton>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Panel>
  )
}

function General() {
  const workspace = useStore((s) => s.workspace)
  const [name, setName] = useState(workspace)
  const [confirm, setConfirm] = useState(false)
  const theme = useTheme()
  const toast = useToast()
  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <form
          className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            const t = name.trim()
            if (!t) return
            renameWorkspace(t)
            toast({ title: 'Workspace renamed' })
          }}
        >
          <Input label="Workspace name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" error={name.trim() ? null : 'The workspace needs a name.'} />
          <Button type="submit" variant="primary" disabled={!name.trim() || name.trim() === workspace}>
            Save
          </Button>
        </form>
      </Panel>
      <Panel>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm">Light theme</p>
            <p className="text-[13px] text-muted">Saved on this device.</p>
          </div>
          <Switch label="Light theme" checked={theme === 'light'} onChange={(on) => setTheme(on ? 'light' : 'dark')} />
        </div>
      </Panel>
      <Panel className="border-blocked/30">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm">Reset demo data</p>
            <p className="text-[13px] text-muted">Replaces every issue, label and member with the starter workspace.</p>
          </div>
          {confirm ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  resetDemo()
                  setConfirm(false)
                  setName(getState().workspace)
                  toast({ title: 'Demo data restored' })
                }}
              >
                Yes, reset
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="danger" icon={<RotateCcw className="size-4" />} onClick={() => setConfirm(true)}>
              Reset
            </Button>
          )}
        </div>
      </Panel>
    </div>
  )
}

export function Settings() {
  const [tab, setTab] = useState<Tab>('general')
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Settings" />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          <SegmentedControl
            label="Settings section"
            size="md"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'general', label: 'General' },
              { value: 'labels', label: 'Labels' },
              { value: 'members', label: 'Members' },
            ]}
          />
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={cn('mt-6')}>
            {tab === 'general' && <General />}
            {tab === 'labels' && <Labels />}
            {tab === 'members' && <Members />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
