// Every string the site and app show, plus the demo workspace the tracker
// starts with. Edit this file first.

export const BRAND = {
  name: 'Triage',
  prefix: 'TRG',
  workspace: 'Acme Engineering',
  tagline: 'Bug tracking for teams that ship fast',
}

export const NAV = {
  login: 'Log in',
  signup: 'Sign up',
}

export const HERO = {
  title: ['Bug tracking for teams', 'that ship fast'],
  body: 'Purpose-built for engineering teams. Triage, track, and resolve issues without slowing down.',
  cta: 'Get started free',
}

export const FEATURES_HEAD = {
  eyebrow: 'Features',
  title: 'Everything between “it broke” and “it shipped”',
  body: 'Triage is opinionated where it saves you time and out of the way everywhere else.',
}

export const FEATURES = [
  { icon: 'keyboard', title: 'Keyboard first', body: 'j and k to move, c to create, ⌘K for everything else. Your hands stay on the keys.' },
  { icon: 'layers', title: 'Grouped by status', body: 'Backlog to Done in one scroll. Collapse what you are not working on.' },
  { icon: 'kanban', title: 'Board view', body: 'Drag issues between columns when you would rather see the flow than the list.' },
  { icon: 'repeat', title: 'Cycles', body: 'Two-week cycles keep scope honest. Unfinished work rolls forward on its own.' },
  { icon: 'chart', title: 'Insights', body: 'Opened versus closed, by priority and by person. No spreadsheet export required.' },
  { icon: 'bell', title: 'Inbox', body: 'Assignments, comments and status changes on the issues you care about, nothing else.' },
] as const

export const CHANGELOG_HEAD = {
  eyebrow: 'Changelog',
  title: 'Shipped recently',
  subscribe: 'Try the changelog form. This demo does not save addresses or send email.',
  placeholder: 'you@company.com',
  button: 'Subscribe',
  done: 'Demo complete. No subscription was saved.',
}

export const CHANGELOG = [
  { version: '2.4', date: 'Nov 4, 2026', title: 'Board view and drag to move', items: ['Kanban board grouped by status', 'Drag cards between columns', 'Card counts per column'] },
  { version: '2.3', date: 'Oct 21, 2026', title: 'Command palette', items: ['⌘K opens a palette for issues and actions', 'Jump to any issue by ID', 'Switch theme from the keyboard'] },
  { version: '2.2', date: 'Oct 7, 2026', title: 'Insights', items: ['Opened vs closed over eight weeks', 'Open issues by priority', 'Workload per teammate'] },
  { version: '2.1', date: 'Sep 23, 2026', title: 'Light theme', items: ['Full light theme with the same hairlines', 'Remembers your choice per device'] },
] as const

export const PRICING_HEAD = {
  eyebrow: 'Pricing',
  title: 'Free until it matters',
  monthly: 'Monthly',
  annual: 'Annual',
  save: 'Save 20%',
}

export const PLANS = [
  {
    name: 'Free',
    monthly: 0,
    blurb: 'For side projects and small teams finding their rhythm.',
    features: ['Up to 5 members', 'Unlimited issues', 'List and board views', 'Community support'],
    cta: 'Get started',
    featured: false,
  },
  {
    name: 'Team',
    monthly: 10,
    blurb: 'For engineering teams shipping every week.',
    features: ['Unlimited members', 'Cycles and insights', 'Inbox and notifications', 'Priority support'],
    cta: 'Start free trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    monthly: null,
    blurb: 'For organisations with security and compliance needs.',
    features: ['SAML SSO and SCIM', 'Audit log', 'Custom data retention', 'Dedicated support'],
    cta: 'Contact sales',
    featured: false,
  },
] as const

export const CTA = {
  title: 'Stop tracking. Start shipping.',
  body: 'Set up your workspace in under a minute. No credit card.',
  button: 'Open the app',
}

export const FOOTER = {
  blurb: 'Bug tracking for teams that ship fast.',
  columns: [
    { title: 'Product', links: [['Features', '/#features'], ['Changelog', '/#changelog'], ['Pricing', '/#pricing'], ['Open app', '/app']] },
    { title: 'App', links: [['Issues', '/app'], ['Board', '/app/board'], ['Insights', '/app/insights'], ['Inbox', '/app/inbox']] },
    { title: 'Resources', links: [['Style guide', '/styleguide'], ['Settings', '/app/settings'], ['Status', '/api/health']] },
  ],
  legal: '© 2026 Triage, Inc.',
} as const

/* ------------------------------------------------------------------ */
/* Tracker vocabulary                                                  */
/* ------------------------------------------------------------------ */

export const STATUSES = [
  { id: 'backlog', name: 'Backlog' },
  { id: 'todo', name: 'Todo' },
  { id: 'in_progress', name: 'In progress' },
  { id: 'in_review', name: 'In review' },
  { id: 'blocked', name: 'Blocked' },
  { id: 'done', name: 'Done' },
  { id: 'canceled', name: 'Canceled' },
] as const
export type StatusId = (typeof STATUSES)[number]['id']
export const CLOSED: StatusId[] = ['done', 'canceled']

export const PRIORITIES = [
  { id: 1, name: 'Urgent' },
  { id: 2, name: 'High' },
  { id: 3, name: 'Medium' },
  { id: 4, name: 'Low' },
  { id: 0, name: 'No priority' },
] as const
export type PriorityId = (typeof PRIORITIES)[number]['id']

export const LABEL_COLORS = ['#f43f5e', '#f97316', '#f5a524', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#a1a1aa'] as const

/* ------------------------------------------------------------------ */
/* Demo workspace                                                      */
/* ------------------------------------------------------------------ */

export type Member = { id: string; name: string; handle: string; hue: number }
export type Label = { id: string; name: string; color: string }
export type Cycle = { id: string; name: string; start: string; end: string }
export type Comment = { id: string; authorId: string; body: string; createdAt: number }
export type Issue = {
  number: number
  title: string
  description: string
  status: StatusId
  priority: PriorityId
  assigneeId: string | null
  labelIds: string[]
  cycleId: string | null
  due: string | null
  createdAt: number
  updatedAt: number
  completedAt: number | null
  comments: Comment[]
}
export type Notice = {
  id: string
  issueNumber: number
  actorId: string
  kind: 'assigned' | 'comment' | 'status' | 'mention'
  text: string
  createdAt: number
  read: boolean
}

export const SEED_MEMBERS: Member[] = [
  { id: 'm1', name: 'Maya Chen', handle: 'maya', hue: 28 },
  { id: 'm2', name: 'Jonas Weber', handle: 'jonas', hue: 210 },
  { id: 'm3', name: 'Priya Natarajan', handle: 'priya', hue: 330 },
  { id: 'm4', name: 'Leo Martins', handle: 'leo', hue: 150 },
  { id: 'm5', name: 'Sam Okafor', handle: 'sam', hue: 265 },
]
export const ME = 'm1'

export const SEED_LABELS: Label[] = [
  { id: 'l1', name: 'Bug', color: '#f43f5e' },
  { id: 'l2', name: 'Regression', color: '#f97316' },
  { id: 'l3', name: 'Performance', color: '#f5a524' },
  { id: 'l4', name: 'Frontend', color: '#3b82f6' },
  { id: 'l5', name: 'Backend', color: '#14b8a6' },
  { id: 'l6', name: 'Feature', color: '#8b5cf6' },
]

type SeedRow = [number, string, StatusId, PriorityId, string | null, string[], number, number | null, number | null]
// [number, title, status, priority, assignee, labels, created days ago, due in days, completed days ago]
const ROWS: SeedRow[] = [
  [142, 'Checkout button unresponsive on Safari 18', 'in_progress', 1, 'm1', ['l1', 'l4'], 2, 1, null],
  [141, 'Webhook retries fire twice after timeout', 'todo', 2, 'm2', ['l1', 'l5'], 3, 4, null],
  [140, 'Add keyboard shortcut cheatsheet', 'backlog', 4, null, ['l6', 'l4'], 4, null, null],
  [139, 'Login redirects loop when session cookie expires', 'blocked', 1, 'm3', ['l1', 'l2'], 5, -1, null],
  [138, 'Search results flicker while typing', 'in_progress', 2, 'm4', ['l1', 'l4'], 6, 3, null],
  [137, 'Rate limiter counts preflight requests', 'in_review', 3, 'm2', ['l5'], 7, 2, null],
  [136, 'Export CSV drops non-ASCII characters', 'todo', 3, 'm5', ['l1', 'l5'], 8, 9, null],
  [135, 'Dashboard p95 latency above 800ms', 'done', 2, 'm2', ['l3', 'l5'], 10, null, 1],
  [134, 'Dark mode toggle ignores system preference', 'in_review', 4, 'm1', ['l4'], 11, 5, null],
  [133, 'Bulk edit for labels', 'backlog', 3, null, ['l6'], 12, null, null],
  [132, 'Avatar upload fails above 2 MB', 'todo', 3, 'm4', ['l1'], 13, 12, null],
  [131, 'Notification emails sent in UTC, not local time', 'done', 3, 'm5', ['l5'], 15, null, 3],
  [130, 'Memory leak in realtime subscription', 'in_progress', 1, 'm2', ['l3', 'l5'], 16, 0, null],
  [129, 'Inline code blocks lose formatting on paste', 'backlog', 4, 'm3', ['l4'], 17, null, null],
  [128, 'Mobile nav overlaps page header', 'done', 2, 'm4', ['l1', 'l4'], 18, null, 5],
  [127, 'Archive old cycles automatically', 'backlog', 0, null, ['l6'], 20, null, null],
  [126, 'Flaky test: billing proration edge case', 'todo', 3, 'm5', ['l5'], 22, 6, null],
  [125, 'Sidebar collapse state not remembered', 'done', 4, 'm1', ['l4'], 23, null, 8],
  [124, 'Image previews blurry on retina displays', 'canceled', 4, 'm4', ['l4'], 25, null, 10],
  [123, 'Slow cold start for API worker', 'done', 2, 'm2', ['l3'], 27, null, 12],
  [122, 'Date picker skips the 31st', 'done', 2, 'm3', ['l1', 'l2'], 29, null, 14],
  [121, 'GitHub sync misses renamed branches', 'in_review', 2, 'm5', ['l5'], 31, 1, null],
  [120, 'Add due dates to issues', 'done', 3, 'm1', ['l6'], 34, null, 18],
  [119, 'Typo in invite email subject', 'done', 4, 'm3', ['l1'], 36, null, 22],
  [118, 'Permissions page 500s for guests', 'done', 1, 'm2', ['l1', 'l5'], 38, null, 25],
  [117, 'Comment editor loses draft on navigation', 'todo', 3, 'm3', ['l1', 'l4'], 40, 10, null],
  [116, 'Reduce bundle size of issue view', 'backlog', 3, 'm4', ['l3', 'l4'], 43, null, null],
  [115, 'Timezone selector missing Kathmandu', 'done', 4, 'm5', ['l1'], 46, null, 30],
  [114, 'Stale cache after label rename', 'done', 2, 'm4', ['l1', 'l2'], 49, null, 33],
  [113, 'Keyboard focus lost after closing modal', 'done', 3, 'm1', ['l1', 'l4'], 52, null, 38],
]

const DESCRIPTIONS: Record<number, string> = {
  142: 'Clicking "Pay now" on Safari 18.1 does nothing. No network request fires. Repro on macOS 15 and iOS 18 with a saved card.\n\nLikely the new pointer-events rule on the overlay.',
  139: 'After the session cookie expires, /login redirects to /app which redirects back to /login. Blocked on the auth service rollout.',
  138: 'Results list unmounts on every keystroke instead of updating in place.',
  130: 'Heap grows ~40 MB/hour per open tab. Subscriptions are not torn down when the issue view unmounts.',
}

export function seedIssues(now = Date.now()): Issue[] {
  const today = new Date(now)
  const day = 86_400_000
  return ROWS.map(([number, title, status, priority, assigneeId, labelIds, created, dueIn, doneAgo]) => {
    const createdAt = now - created * day - (number % 7) * 3_600_000
    let due: string | null = null
    if (dueIn !== null) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dueIn)
      due = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    const completedAt = doneAgo === null ? null : now - doneAgo * day
    const comments: Comment[] =
      number === 142
        ? [
            { id: 'c1', authorId: 'm4', body: 'Reproduced on Safari 18.1. Chrome and Firefox are fine.', createdAt: now - 30 * 3_600_000 },
            { id: 'c2', authorId: 'm1', body: 'Found it: the loading overlay keeps pointer-events after fade-out. Fix in review shortly.', createdAt: now - 4 * 3_600_000 },
          ]
        : number === 139
          ? [{ id: 'c3', authorId: 'm3', body: 'Waiting on the auth service deploy before I can test the fix.', createdAt: now - 20 * 3_600_000 }]
          : []
    return {
      number,
      title,
      description: DESCRIPTIONS[number] ?? '',
      status,
      priority,
      assigneeId,
      labelIds,
      cycleId: created <= 14 && status !== 'backlog' ? 'cy2' : created <= 28 ? 'cy1' : null,
      due,
      createdAt,
      updatedAt: completedAt ?? createdAt,
      completedAt,
      comments,
    }
  })
}

export function seedCycles(now = Date.now()): Cycle[] {
  const d = new Date(now)
  const iso = (offset: number) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset)
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  }
  return [
    { id: 'cy1', name: 'Cycle 23', start: iso(-27), end: iso(-14) },
    { id: 'cy2', name: 'Cycle 24', start: iso(-13), end: iso(0) },
    { id: 'cy3', name: 'Cycle 25', start: iso(1), end: iso(14) },
  ]
}

export function seedNotices(now = Date.now()): Notice[] {
  const h = 3_600_000
  return [
    { id: 'n1', issueNumber: 142, actorId: 'm4', kind: 'comment', text: 'commented: "Reproduced on Safari 18.1…"', createdAt: now - 30 * h, read: false },
    { id: 'n2', issueNumber: 134, actorId: 'm2', kind: 'status', text: 'moved this to In review', createdAt: now - 26 * h, read: false },
    { id: 'n3', issueNumber: 142, actorId: 'm3', kind: 'assigned', text: 'assigned this to you', createdAt: now - 48 * h, read: false },
    { id: 'n4', issueNumber: 125, actorId: 'm5', kind: 'mention', text: 'mentioned you: "@maya can you confirm on mobile?"', createdAt: now - 8 * 24 * h, read: true },
    { id: 'n5', issueNumber: 120, actorId: 'm2', kind: 'status', text: 'closed this as Done', createdAt: now - 18 * 24 * h, read: true },
  ]
}
