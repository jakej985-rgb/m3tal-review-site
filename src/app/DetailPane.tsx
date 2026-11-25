import { ArrowDown, ArrowUp, Link2, Pencil, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { Textarea } from '@/components/Field'
import { IconButton } from '@/components/IconButton'
import { Kbd } from '@/components/Kbd'
import { useToast } from '@/components/Toast'
import { cn } from '@/lib/cn'
import { ago } from '@/lib/dates'
import { AssigneePicker, CyclePicker, DuePicker, LabelsPicker, PriorityPicker, StatusPicker } from './props'
import { useUI } from './ui'
import { addComment, deleteComment, deleteIssue, issueKey, patchIssue, restoreIssue, useStore } from './store'

function Prop({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-9 grid-cols-[88px_1fr] items-center gap-2">
      <dt className="text-[13px] text-muted">{name}</dt>
      <dd className="min-w-0 pl-2">{children}</dd>
    </div>
  )
}

/** Autosizing plain textarea used for the title. */
function TitleField({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [v, setV] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => setV(value), [value])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [v])
  const commit = () => {
    const t = v.trim()
    if (!t) setV(value)
    else if (t !== value) onCommit(t)
  }
  return (
    <textarea
      ref={ref}
      value={v}
      rows={1}
      aria-label="Issue title"
      onChange={(e) => setV(e.target.value.replace(/\n/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          ;(e.target as HTMLTextAreaElement).blur()
        }
      }}
      className="-mx-2 w-[calc(100%+16px)] resize-none overflow-hidden bg-transparent px-2 py-1 text-[20px] leading-snug font-semibold tracking-[-0.02em] outline-none hover:bg-surface-2/50 focus:bg-surface-2/50"
    />
  )
}

type Props = {
  number: number
  onClose: () => void
  onStep?: (dir: 1 | -1) => void
  className?: string
}

export function DetailPane({ number, onClose, onStep, className }: Props) {
  const issue = useStore((s) => s.issues.find((i) => i.number === number))
  const members = useStore((s) => s.members)
  const cycles = useStore((s) => s.cycles)
  const meId = useStore((s) => s.meId)
  const toast = useToast()
  const ui = useUI()
  const [desc, setDesc] = useState(issue?.description ?? '')
  const [comment, setComment] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setDesc(issue?.description ?? '')
    setConfirmDelete(false)
    // reset only when switching issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [number])

  if (!issue) {
    return (
      <div className={cn('flex flex-col', className)}>
        <div className="flex h-12 items-center justify-end border-b border-line px-2">
          <IconButton label="Close details" size="sm" onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </div>
        <EmptyState title="Issue not found" body="It may have been deleted." />
      </div>
    )
  }

  const key = issueKey(issue.number)
  const assignee = members.find((m) => m.id === issue.assigneeId)
  const cycle = cycles.find((c) => c.id === issue.cycleId)

  const send = () => {
    const body = comment.trim()
    if (!body) return
    addComment(issue.number, body)
    setComment('')
  }

  const remove = () => {
    const snapshot = issue
    deleteIssue(issue.number)
    onClose()
    toast({ title: `${key} deleted`, action: { label: 'Undo', run: () => restoreIssue(snapshot) } })
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line pr-2 pl-5">
        <span className="font-mono text-[12px] text-muted">{key}</span>
        <span className="flex-1" />
        {onStep && (
          <>
            <IconButton label="Previous issue (k)" size="sm" onClick={() => onStep(-1)}>
              <ArrowUp className="size-4" />
            </IconButton>
            <IconButton label="Next issue (j)" size="sm" onClick={() => onStep(1)}>
              <ArrowDown className="size-4" />
            </IconButton>
          </>
        )}
        <IconButton label="Edit in dialog" size="sm" onClick={() => ui.openEdit(number)}>
          <Pencil className="size-4" />
        </IconButton>
        <IconButton
          label="Copy link"
          size="sm"
          onClick={() => {
            const url = `${window.location.origin}/app?issue=${issue.number}`
            navigator.clipboard?.writeText(url).then(
              () => toast({ title: `Link to ${key} copied` }),
              () => toast({ title: 'Could not copy the link' }),
            )
          }}
        >
          <Link2 className="size-4" />
        </IconButton>
        <IconButton label="Delete issue" size="sm" onClick={() => setConfirmDelete((c) => !c)} active={confirmDelete}>
          <Trash2 className="size-4" />
        </IconButton>
        <IconButton label="Close details" size="sm" onClick={onClose}>
          <X className="size-4" />
        </IconButton>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-b border-line">
            <div className="flex items-center gap-2 bg-blocked/8 px-5 py-3 text-[13px]">
              <span className="flex-1">Delete {key}? You can undo for a few seconds.</span>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={remove}>
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <motion.div key={issue.number} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="px-5 pt-4">
          <TitleField value={issue.title} onCommit={(title) => patchIssue(issue.number, { title })} />
          <Textarea
            aria-label="Description"
            placeholder="Add a description…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={() => desc !== issue.description && patchIssue(issue.number, { description: desc })}
            className="mt-2 [&_textarea]:min-h-20 [&_textarea]:border-transparent [&_textarea]:px-0 [&_textarea]:text-muted [&_textarea]:hover:border-transparent [&_textarea]:focus:border-line [&_textarea]:focus:px-2"
          />
        </motion.div>

        <div className="mx-5 mt-3 border-t border-line" />
        <dl className="flex flex-col px-5 py-3">
          <Prop name="Status">
            <StatusPicker value={issue.status} onChange={(status) => patchIssue(issue.number, { status })} />
          </Prop>
          <Prop name="Priority">
            <PriorityPicker value={issue.priority} onChange={(priority) => patchIssue(issue.number, { priority })} />
          </Prop>
          <Prop name="Assignee">
            <AssigneePicker value={issue.assigneeId} onChange={(assigneeId) => patchIssue(issue.number, { assigneeId })} />
          </Prop>
          <Prop name="Due">
            <DuePicker value={issue.due} onChange={(due) => patchIssue(issue.number, { due })} />
          </Prop>
          <Prop name="Labels">
            <LabelsPicker value={issue.labelIds} onChange={(labelIds) => patchIssue(issue.number, { labelIds })} />
          </Prop>
          <Prop name="Cycle">
            <CyclePicker value={issue.cycleId} onChange={(cycleId) => patchIssue(issue.number, { cycleId })} />
          </Prop>
        </dl>
        <div className="mx-5 border-t border-line" />

        <section aria-label="Activity" className="px-5 py-4">
          <h3 className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">Activity</h3>
          <ol className="mt-4 flex flex-col gap-4">
            <li className="flex items-center gap-2.5 text-[13px] text-muted">
              <span className="flex size-[22px] items-center justify-center">
                <span className="size-1.5 bg-line-strong" />
              </span>
              <span>
                Created {ago(issue.createdAt)}
                {assignee && <> · assigned to {assignee.name}</>}
                {cycle && <> · {cycle.name}</>}
              </span>
            </li>
            <AnimatePresence initial={false}>
              {issue.comments.map((c) => {
                const author = members.find((m) => m.id === c.authorId)
                return (
                  <motion.li key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="group flex gap-2.5">
                    <Avatar member={author} size="sm" className="mt-0.5" />
                    <div className="min-w-0 flex-1 border border-line bg-bg/40 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-[13px]">
                        <span className="font-medium">{author?.name ?? 'Former member'}</span>
                        <span className="text-xs text-muted">{ago(c.createdAt)}</span>
                        {c.authorId === meId && (
                          <button
                            type="button"
                            onClick={() => deleteComment(issue.number, c.id)}
                            className="hit ml-auto text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-fg focus-visible:opacity-100"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-[13.5px] leading-relaxed whitespace-pre-wrap text-fg">{c.body}</p>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ol>
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <Textarea
              aria-label="Leave a comment"
              placeholder="Leave a comment…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  send()
                }
              }}
              className="[&_textarea]:min-h-20"
            />
            <div className="mt-2 flex items-center justify-end gap-3">
              <span className="hidden items-center gap-1 text-xs text-muted sm:flex">
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
              </span>
              <Button type="submit" size="sm" variant="primary" disabled={!comment.trim()}>
                Comment
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
