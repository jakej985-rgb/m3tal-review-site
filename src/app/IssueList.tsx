import { ChevronRight, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { memo, useEffect, useRef } from 'react'

import { Avatar } from '@/components/Avatar'
import { DueBadge } from '@/components/DueBadge'
import { IconButton } from '@/components/IconButton'
import { LabelChip } from '@/components/LabelChip'
import { PriorityIcon } from '@/components/PriorityIcon'
import { StatusIcon } from '@/components/StatusIcon'
import { type Issue, type Label, type Member, PRIORITIES, STATUSES, type StatusId } from '@/data'
import { cn } from '@/lib/cn'
import { AssigneePicker, PriorityPicker, StatusPicker } from './props'
import { issueKey, patchIssue } from './store'
import type { Grouping } from './ui'

export type Group = { key: string; title: string; icon: React.ReactNode; issues: Issue[]; defaults: Partial<Pick<Issue, 'status' | 'priority' | 'assigneeId'>> }

export function groupIssues(issues: Issue[], by: Grouping, members: Member[]): Group[] {
  if (by === 'none') return [{ key: 'all', title: 'All issues', icon: null, issues, defaults: {} }]
  if (by === 'status')
    return STATUSES.map((s) => ({ key: s.id, title: s.name, icon: <StatusIcon status={s.id} />, issues: issues.filter((i) => i.status === s.id), defaults: { status: s.id as StatusId } }))
  if (by === 'priority')
    return PRIORITIES.map((p) => ({ key: `p${p.id}`, title: p.name, icon: <PriorityIcon priority={p.id} />, issues: issues.filter((i) => i.priority === p.id), defaults: { priority: p.id } }))
  return [
    ...members.map((m) => ({ key: m.id, title: m.name, icon: <Avatar member={m} size="xs" decorative />, issues: issues.filter((i) => i.assigneeId === m.id), defaults: { assigneeId: m.id } })),
    { key: 'none', title: 'Unassigned', icon: <Avatar member={null} size="xs" decorative />, issues: issues.filter((i) => !i.assigneeId), defaults: { assigneeId: null } },
  ]
}

type RowProps = {
  issue: Issue
  labels: Label[]
  selected: boolean
  focused: boolean
  onOpen: (n: number) => void
}

export const IssueRow = memo(function IssueRow({ issue, labels, selected, focused, onOpen }: RowProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: 'nearest' })
  }, [focused])
  const chips = labels.filter((l) => issue.labelIds.includes(l.id))
  return (
    <motion.div
      ref={ref}
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      data-issue={issue.number}
      aria-current={selected || undefined}
      className={cn(
        'group relative flex h-11 items-center gap-1 border-b border-line pr-2 pl-3 sm:pl-4',
        selected ? 'hatch bg-surface-2/70' : focused ? 'bg-surface-2/60' : 'hover:bg-surface-2/40',
      )}
    >
      {focused && <span className="absolute inset-y-0 left-0 w-0.5 bg-fg" aria-hidden />}
      <StatusPicker variant="icon" value={issue.status} onChange={(status) => patchIssue(issue.number, { status })} />
      <button
        type="button"
        onClick={() => onOpen(issue.number)}
        className="flex h-full min-w-0 flex-1 items-center gap-3 pl-1 text-left focus-visible:outline-offset-[-2px]"
      >
        <span className="w-[68px] shrink-0 font-mono text-[12px] text-muted">{issueKey(issue.number)}</span>
        <span className={cn('truncate text-[13.5px]', issue.status === 'done' || issue.status === 'canceled' ? 'text-muted' : 'text-fg')}>{issue.title}</span>
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 pl-3 lg:flex">
          {chips.slice(0, 2).map((l) => (
            <LabelChip key={l.id} color={l.color}>
              {l.name}
            </LabelChip>
          ))}
        </span>
        <DueBadge due={issue.status === 'done' || issue.status === 'canceled' ? null : issue.due} className="hidden shrink-0 sm:inline-flex" />
      </button>
      <span className="hidden sm:contents">
        <PriorityPicker variant="icon" value={issue.priority} onChange={(priority) => patchIssue(issue.number, { priority })} />
      </span>
      <AssigneePicker variant="icon" value={issue.assigneeId} onChange={(assigneeId) => patchIssue(issue.number, { assigneeId })} />
    </motion.div>
  )
})

type ListProps = {
  groups: Group[]
  labels: Label[]
  selected: number | null
  focused: number | null
  collapsed: string[]
  onToggle: (key: string) => void
  onOpen: (n: number) => void
  onCreate: (defaults: Group['defaults']) => void
}

export function IssueList({ groups, labels, selected, focused, collapsed, onToggle, onOpen, onCreate }: ListProps) {
  return (
    <div role="list" aria-label="Issues">
      {groups.map((g) => {
        if (g.issues.length === 0 && g.key !== 'all') return null
        const closed = collapsed.includes(g.key)
        return (
          <section key={g.key} role="listitem" aria-label={`${g.title}, ${g.issues.length} issues`}>
            <div className="sticky top-0 z-10 flex h-9 items-center gap-1 border-b border-line bg-surface pr-2 pl-2 sm:pl-3">
              <button
                type="button"
                onClick={() => onToggle(g.key)}
                aria-expanded={!closed}
                className="flex h-full flex-1 items-center gap-2.5 px-1 text-left text-[13px] font-medium"
              >
                <ChevronRight className={cn('size-3.5 text-faint transition-transform duration-200', !closed && 'rotate-90')} aria-hidden />
                {g.icon}
                <span>{g.title}</span>
                <span className="font-mono text-[11px] font-normal text-muted">{g.issues.length}</span>
              </button>
              <IconButton label={`New issue in ${g.title}`} size="sm" onClick={() => onCreate(g.defaults)}>
                <Plus className="size-4" />
              </IconButton>
            </div>
            <AnimatePresence initial={false}>
              {!closed && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                  <AnimatePresence initial={false}>
                    {g.issues.map((i) => (
                      <IssueRow key={i.number} issue={i} labels={labels} selected={selected === i.number} focused={focused === i.number} onOpen={onOpen} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )
      })}
    </div>
  )
}
