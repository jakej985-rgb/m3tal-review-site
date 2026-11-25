import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type DragEvent, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { DueBadge } from '@/components/DueBadge'
import { IconButton } from '@/components/IconButton'
import { LabelChip } from '@/components/LabelChip'
import { PriorityIcon } from '@/components/PriorityIcon'
import { StatusIcon } from '@/components/StatusIcon'
import { useToast } from '@/components/Toast'
import { CLOSED, type Issue, STATUSES, type StatusId } from '@/data'
import { cn } from '@/lib/cn'
import { issueKey, patchIssue, useStore } from './store'
import { useUI } from './ui'

const MIME = 'application/x-triage-issue'

function Card({ issue, selected, onOpen, dragging, onDragStart, onDragEnd }: { issue: Issue; selected: boolean; onOpen: () => void; dragging: boolean; onDragStart: () => void; onDragEnd: () => void }) {
  const labels = useStore((s) => s.labels)
  const member = useStore((s) => s.members.find((m) => m.id === issue.assigneeId) ?? null)
  const chips = labels.filter((l) => issue.labelIds.includes(l.id))
  return (
    <motion.div layout layoutId={`card-${issue.number}`} transition={{ type: 'spring', stiffness: 500, damping: 40 }}>
      <button
        type="button"
        draggable
        onDragStart={(e: DragEvent<HTMLButtonElement>) => {
          e.dataTransfer.setData(MIME, String(issue.number))
          e.dataTransfer.setData('text/plain', issueKey(issue.number))
          e.dataTransfer.effectAllowed = 'move'
          onDragStart()
        }}
        onDragEnd={onDragEnd}
        onClick={onOpen}
        className={cn(
          'block w-full cursor-grab border border-line bg-surface p-3 text-left transition-[border-color,opacity,transform] duration-150 hover:border-line-strong active:cursor-grabbing',
          selected && 'hatch border-line-strong',
          dragging && 'opacity-40',
        )}
      >
        <div className="flex items-center gap-2">
          <PriorityIcon priority={issue.priority} />
          <span className="font-mono text-[11.5px] text-muted">{issueKey(issue.number)}</span>
          <span className="ml-auto">
            <Avatar member={member} size="xs" />
          </span>
        </div>
        <p className={cn('mt-2 text-[13.5px] leading-snug', CLOSED.includes(issue.status) ? 'text-muted' : 'text-fg')}>{issue.title}</p>
        {(chips.length > 0 || issue.due) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {chips.slice(0, 2).map((l) => (
              <LabelChip key={l.id} color={l.color}>
                {l.name}
              </LabelChip>
            ))}
            {!CLOSED.includes(issue.status) && <DueBadge due={issue.due} className="ml-auto" />}
          </div>
        )}
      </button>
    </motion.div>
  )
}

export function Board({ issues, showClosed, onOpen, selected }: { issues: Issue[]; showClosed: boolean; onOpen: (n: number) => void; selected: number | null }) {
  const ui = useUI()
  const toast = useToast()
  const [over, setOver] = useState<StatusId | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const cols = STATUSES.filter((s) => showClosed || !CLOSED.includes(s.id))

  const drop = (status: StatusId, e: DragEvent) => {
    e.preventDefault()
    setOver(null)
    const n = Number(e.dataTransfer.getData(MIME))
    const issue = issues.find((i) => i.number === n)
    if (!issue || issue.status === status) return
    const prev = issue.status
    patchIssue(n, { status })
    toast({
      title: `${issueKey(n)} moved to ${STATUSES.find((s) => s.id === status)?.name}`,
      action: { label: 'Undo', run: () => patchIssue(n, { status: prev }) },
    })
  }

  return (
    <div className="flex h-full min-h-[420px] gap-3 overflow-x-auto p-3 sm:p-4" role="list" aria-label="Board columns">
      {cols.map((col) => {
        const xs = issues.filter((i) => i.status === col.id)
        const isOver = over === col.id
        return (
          <section
            key={col.id}
            role="listitem"
            aria-label={`${col.name}, ${xs.length} issues`}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes(MIME)) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
              if (over !== col.id) setOver(col.id)
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver((o) => (o === col.id ? null : o))
            }}
            onDrop={(e) => drop(col.id, e)}
            className={cn('flex w-[272px] shrink-0 flex-col border bg-bg/40 transition-colors duration-150', isOver ? 'hatch border-line-strong bg-surface-2/60' : 'border-line')}
          >
            <header className="flex h-10 shrink-0 items-center gap-2 border-b border-line pr-1 pl-3">
              <StatusIcon status={col.id} />
              <h2 className="text-[13px] font-medium">{col.name}</h2>
              <span className="font-mono text-[11px] text-muted">{xs.length}</span>
              <IconButton label={`New issue in ${col.name}`} size="sm" className="ml-auto" onClick={() => ui.openCreate({ status: col.id })}>
                <Plus className="size-4" />
              </IconButton>
            </header>
            <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2">
              <AnimatePresence initial={false}>
                {xs.map((i) => (
                  <Card
                    key={i.number}
                    issue={i}
                    selected={selected === i.number}
                    onOpen={() => onOpen(i.number)}
                    dragging={dragging === i.number}
                    onDragStart={() => setDragging(i.number)}
                    onDragEnd={() => {
                      setDragging(null)
                      setOver(null)
                    }}
                  />
                ))}
              </AnimatePresence>
              {xs.length === 0 && (
                <p className={cn('flex flex-1 items-center justify-center border border-dashed border-line px-3 py-6 text-center text-xs text-muted', isOver && 'border-line-strong text-fg')}>
                  {isOver ? 'Drop to move here' : 'No issues'}
                </p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
