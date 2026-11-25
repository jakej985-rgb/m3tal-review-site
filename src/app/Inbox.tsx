import { AtSign, CheckCheck, CircleDot, MessageSquare, Trash2, UserRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { IconButton } from '@/components/IconButton'
import { SegmentedControl } from '@/components/SegmentedControl'
import { StatusIcon } from '@/components/StatusIcon'
import type { Notice } from '@/data'
import { cn } from '@/lib/cn'
import { ago } from '@/lib/dates'
import { navigate } from '@/lib/router'
import { PageHeader } from './IssuesView'
import { deleteNotice, issueKey, markAllNotices, markNotice, useStore } from './store'

const KIND_ICON: Record<Notice['kind'], typeof AtSign> = {
  assigned: UserRound,
  comment: MessageSquare,
  status: CircleDot,
  mention: AtSign,
}

export function Inbox() {
  const notices = useStore((s) => s.notices)
  const issues = useStore((s) => s.issues)
  const members = useStore((s) => s.members)
  const [tab, setTab] = useState<'unread' | 'all'>('unread')
  const unread = notices.filter((n) => !n.read).length
  const shown = [...notices].sort((a, b) => b.createdAt - a.createdAt).filter((n) => tab === 'all' || !n.read)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Inbox" count={unread}>
        <Button size="sm" variant="outline" icon={<CheckCheck className="size-4" />} onClick={markAllNotices} disabled={unread === 0}>
          <span className="max-sm:sr-only">Mark all read</span>
        </Button>
      </PageHeader>
      <div className="flex items-center gap-2 border-b border-line px-3 py-2 sm:px-4">
        <SegmentedControl
          label="Show"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'unread', label: `Unread${unread ? ` · ${unread}` : ''}` },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-surface">
        {shown.length === 0 ? (
          <EmptyState
            title={tab === 'unread' ? 'Inbox zero' : 'No notifications'}
            body={tab === 'unread' ? 'Nothing new. Comment on a teammate’s issue and their reply will land here.' : 'Assignments, comments and status changes show up here.'}
            action={
              tab === 'unread' && notices.length > 0 ? (
                <Button size="sm" variant="outline" onClick={() => setTab('all')}>
                  Show all
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul aria-label="Notifications">
            <AnimatePresence initial={false}>
              {shown.map((n) => {
                const issue = issues.find((i) => i.number === n.issueNumber)
                const actor = members.find((m) => m.id === n.actorId)
                const Icon = KIND_ICON[n.kind]
                return (
                  <motion.li key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="group relative flex items-start gap-3 border-b border-line py-3 pr-2 pl-4 hover:bg-surface-2/40">
                    {!n.read && (
                      <span className="absolute top-[22px] left-1.5 size-1.5 bg-progress">
                        <span className="sr-only">Unread</span>
                      </span>
                    )}
                    <span className="relative mt-0.5">
                      <Avatar member={actor} size="md" />
                      <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center border border-line bg-surface text-muted">
                        <Icon className="size-2.5" aria-hidden />
                      </span>
                    </span>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        markNotice(n.id, true)
                        navigate(`/app?issue=${n.issueNumber}`)
                      }}
                    >
                      <span className="flex items-center gap-2 text-[13px]">
                        {issue && <StatusIcon status={issue.status} size={12} />}
                        <span className="font-mono text-[12px] text-muted">{issueKey(n.issueNumber)}</span>
                        <span className={cn('truncate', n.read ? 'text-muted' : 'font-medium text-fg')}>{issue?.title ?? 'Deleted issue'}</span>
                      </span>
                      <span className="mt-1 block truncate text-[13px] text-muted">
                        <span className="text-fg/90">{actor?.name ?? 'Someone'}</span> {n.text}
                      </span>
                    </button>
                    <span className="mt-0.5 shrink-0 font-mono text-[11px] text-muted">{ago(n.createdAt)}</span>
                    <span className="flex shrink-0 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                      <IconButton label={n.read ? 'Mark as unread' : 'Mark as read'} size="sm" onClick={() => markNotice(n.id, !n.read)}>
                        <CheckCheck className="size-4" />
                      </IconButton>
                      <IconButton label="Delete notification" size="sm" onClick={() => deleteNotice(n.id)}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </span>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
