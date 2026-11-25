import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/Button'
import { Textarea } from '@/components/Field'
import { Kbd } from '@/components/Kbd'
import { Modal } from '@/components/Modal'
import { Switch } from '@/components/Switch'
import { useToast } from '@/components/Toast'
import { BRAND } from '@/data'
import { cn } from '@/lib/cn'
import { AssigneePicker, CyclePicker, DuePicker, LabelsPicker, PriorityPicker, StatusPicker } from './props'
import { createIssue, getState, type IssueDraft, issueKey, patchIssue } from './store'

const BLANK: IssueDraft = { title: '', description: '', status: 'todo', priority: 0, assigneeId: null, labelIds: [], cycleId: null, due: null }

type Props = {
  open: boolean
  editing: number | null
  defaults?: Partial<IssueDraft>
  onClose: () => void
  onCreated: (n: number) => void
}

export function IssueModal({ open, editing, defaults, onClose, onCreated }: Props) {
  const toast = useToast()
  const [draft, setDraft] = useState<IssueDraft>(BLANK)
  const [error, setError] = useState<string | null>(null)
  const [more, setMore] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (editing !== null) {
      const i = getState().issues.find((x) => x.number === editing)
      if (i) {
        const { title, description, status, priority, assigneeId, labelIds, cycleId, due } = i
        setDraft({ title, description, status, priority, assigneeId, labelIds, cycleId, due })
        return
      }
    }
    setDraft({ ...BLANK, ...defaults })
  }, [open, editing, defaults])

  const set = <K extends keyof IssueDraft>(k: K, v: IssueDraft[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const submit = () => {
    const title = draft.title.trim()
    if (!title) {
      setError('Give the issue a title.')
      titleRef.current?.focus()
      return
    }
    if (editing !== null) {
      patchIssue(editing, { ...draft, title })
      toast({ title: `${issueKey(editing)} updated` })
      onClose()
      return
    }
    const n = createIssue({ ...draft, title })
    toast({ title: `${issueKey(n)} created` })
    if (more) {
      setDraft((d) => ({ ...BLANK, status: d.status, cycleId: d.cycleId, assigneeId: d.assigneeId }))
      titleRef.current?.focus()
    } else {
      onCreated(n)
      onClose()
    }
  }

  const heading = editing !== null ? `Edit ${issueKey(editing)}` : 'New issue'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={heading}
      width={640}
      position="top"
      footer={
        <>
          {editing === null && (
            <label className="mr-auto flex items-center gap-2 text-[13px] text-muted">
              <Switch label="Create more" checked={more} onChange={setMore} />
              Create more
            </label>
          )}
          <span className="hidden items-center gap-1 sm:flex">
            <Kbd>⌘</Kbd>
            <Kbd>↵</Kbd>
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={submit}>
            {editing !== null ? 'Save changes' : 'Create issue'}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            submit()
          }
        }}
        className="flex flex-col gap-3 px-5 pt-4 pb-5"
      >
        <p className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">{BRAND.workspace}</p>
        <div>
          <input
            ref={titleRef}
            data-autofocus
            value={draft.title}
            onChange={(e) => {
              set('title', e.target.value)
              if (error) setError(null)
            }}
            placeholder="Issue title"
            aria-label="Issue title"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'title-err' : undefined}
            className={cn('h-11 w-full border-b bg-transparent text-[20px] font-semibold tracking-[-0.02em] outline-none placeholder:text-faint', error ? 'border-blocked' : 'border-transparent focus:border-line')}
          />
          {error && (
            <p id="title-err" role="alert" className="mt-1.5 text-xs text-blocked">
              {error}
            </p>
          )}
        </div>
        <Textarea aria-label="Description" placeholder="Add a description…" value={draft.description} onChange={(e) => set('description', e.target.value)} className="[&_textarea]:min-h-28" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 border-t border-line pt-3 sm:grid-cols-3">
          {(
            [
              ['Status', <StatusPicker key="s" value={draft.status} onChange={(v) => set('status', v)} />],
              ['Priority', <PriorityPicker key="p" value={draft.priority} onChange={(v) => set('priority', v)} />],
              ['Assignee', <AssigneePicker key="a" value={draft.assigneeId} onChange={(v) => set('assigneeId', v)} />],
              ['Labels', <LabelsPicker key="l" value={draft.labelIds} onChange={(v) => set('labelIds', v)} />],
              ['Cycle', <CyclePicker key="c" value={draft.cycleId} onChange={(v) => set('cycleId', v)} />],
              ['Due', <DuePicker key="d" value={draft.due} onChange={(v) => set('due', v)} />],
            ] as const
          ).map(([name, el]) => (
            <div key={name} className="flex min-w-0 flex-col pl-2">
              <span className="text-[11px] text-muted">{name}</span>
              {el}
            </div>
          ))}
        </div>
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}
