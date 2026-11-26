// Every string the site and app show, plus the demo workspace the tracker
// starts with. Edit this file first.

export const BRAND = {
  name: 'M3TAL Review',
  prefix: 'REV',
  workspace: 'm3tal-review',
  tagline: 'AI-less code review that never guesses',
  repo: 'https://github.com/jakej985-rgb/-m3tal-review-',
}

export const NAV = {
  login: 'Log in',
  signup: 'Sign up',
  github: 'GitHub',
}

export const HERO = {
  title: ['AI-less code review', 'that never guesses'],
  body: 'Deterministic audits for maintainability, quality and security. Actionable findings, a 0–100 grade, and a review trail you can defend.',
  cta: 'See a sample review',
}

export const FEATURES_HEAD = {
  eyebrow: 'Features',
  title: 'Everything between “commit” and “merge”',
  body: 'Rules instead of a model. Every finding is explainable, reproducible, and scored the same way twice.',
}

export const FEATURES = [
  { icon: 'gauge', title: 'Graded, not guessed', body: 'A deterministic 0–100 score and an A–F grade, from severity-weighted findings and confidence multipliers.' },
  { icon: 'git', title: 'Reviews what you are about to commit', body: 'Run on staged changes, the working tree, or a patch from stdin. Same input, same report, every time.' },
  { icon: 'scan', title: 'Slop detector', body: 'Redundant booleans, empty blocks, deep nesting, unreachable code and oversized functions across ten languages.' },
  { icon: 'shield', title: 'Security and supply chain', body: 'Around 100 rules for injection, exposed secrets, crypto misuse, unpinned CI actions and IaC exposure.' },
  { icon: 'layers', title: 'Dual-tier analysis', body: 'An optional Go semantic tier builds a typed SSA model and runs six engines: flow, statemachine, typestate, concurrency, authproto and protocol.' },
  { icon: 'terminal', title: 'Fits your workflow', body: 'Git hooks, CI workflows, policy files and durable audit logging. Optional gitleaks, gosec and osv-scanner passes.' },
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
  { version: '0.4', date: 'Nov 21, 2026', title: 'Go semantic tier', items: ['Whole-program typed SSA model via go/packages', 'Six engines: flow, statemachine, typestate, concurrency, authproto, protocol', 'Per-analyzer budgets and --semantic-timeout'] },
  { version: '0.3', date: 'Nov 14, 2026', title: 'Grading and the slop detector', items: ['Deterministic 0–100 score and A–F grade', 'Severity-weighted findings with confidence multipliers', 'Slop checks for ten languages'] },
  { version: '0.2', date: 'Nov 8, 2026', title: 'Security and supply-chain rules', items: ['~100 rules for injection, exposed secrets and crypto misuse', 'Unpinned CI actions and IaC exposures', 'Optional gitleaks, gosec and osv-scanner passes'] },
  { version: '0.1', date: 'Nov 2, 2026', title: 'First release', items: ['Review on staged changes, audit on the working tree', 'Patches from diff or stdin', 'Policy file and durable audit log'] },
] as const

export const PRICING_HEAD = {
  eyebrow: 'Pricing',
  title: 'Free, because it is open source',
}

export type Plan = {
  name: string
  price: number
  priceSuffix?: string
  blurb: string
  features: readonly string[]
  cta: string
  href: string
  featured?: boolean
}

export const PLANS: Plan[] = [
  {
    name: 'Open source',
    price: 0,
    priceSuffix: 'for every repo',
    blurb: 'The whole auditor, free for every repository you own. Clone it and run it on your next commit.',
    features: ['Every rule, both tiers', 'Unlimited repositories', 'Git hooks and CI templates', 'Community support'],
    cta: 'Get it on GitHub',
    href: BRAND.repo,
    featured: true,
  },
]

export const CTA = {
  title: 'Stop guessing. Start grading.',
  body: 'Clone the repo, run m3tal-review on your next commit, and read the grade.',
  button: 'Open the tracker',
}

export const FOOTER = {
  blurb: `${BRAND.tagline}.`,
  columns: [
    { title: 'Product', links: [['Features', '/#features'], ['Changelog', '/#changelog'], ['Pricing', '/#pricing'], ['Open app', '/app']] },
    { title: 'App', links: [['Issues', '/app'], ['Board', '/app/board'], ['Insights', '/app/insights'], ['Inbox', '/app/inbox']] },
    { title: 'Resources', links: [['Style guide', '/styleguide'], ['Settings', '/app/settings'], ['Status', '/api/health']] },
  ],
  legal: '© 2026 M3TAL Review',
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

// Language of the code under review, shown in the issue key: REV-GO-142.
// Mirrors m3tal-review's supported languages, JS/TS as one entry as the tool
// documents it. Ids stay short so a key still fits the list column.
export const LANGS = [
  { id: 'GO', name: 'Go' },
  { id: 'TS', name: 'TypeScript' },
  { id: 'PY', name: 'Python' },
  { id: 'JAVA', name: 'Java' },
  { id: 'KT', name: 'Kotlin' },
  { id: 'CPP', name: 'C++' },
  { id: 'CS', name: 'C#' },
  { id: 'RS', name: 'Rust' },
  { id: 'SWIFT', name: 'Swift' },
  { id: 'PHP', name: 'PHP' },
] as const
export type Lang = (typeof LANGS)[number]['id']

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
  lang: Lang
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

type SeedRow = [number, string, StatusId, PriorityId, string | null, string[], number, number | null, number | null, Lang]
// [number, title, status, priority, assignee, labels, created days ago, due in days, completed days ago, language]
const ROWS: SeedRow[] = [
  [142, 'Checkout button unresponsive on Safari 18', 'in_progress', 1, 'm1', ['l1', 'l4'], 2, 1, null, 'TS'],
  [141, 'Webhook retries fire twice after timeout', 'todo', 2, 'm2', ['l1', 'l5'], 3, 4, null, 'GO'],
  [140, 'Add keyboard shortcut cheatsheet', 'backlog', 4, null, ['l6', 'l4'], 4, null, null, 'TS'],
  [139, 'Login redirects loop when session cookie expires', 'blocked', 1, 'm3', ['l1', 'l2'], 5, -1, null, 'GO'],
  [138, 'Search results flicker while typing', 'in_progress', 2, 'm4', ['l1', 'l4'], 6, 3, null, 'TS'],
  [137, 'Rate limiter counts preflight requests', 'in_review', 3, 'm2', ['l5'], 7, 2, null, 'GO'],
  [136, 'Export CSV drops non-ASCII characters', 'todo', 3, 'm5', ['l1', 'l5'], 8, 9, null, 'PY'],
  [135, 'Dashboard p95 latency above 800ms', 'done', 2, 'm2', ['l3', 'l5'], 10, null, 1, 'GO'],
  [134, 'Dark mode toggle ignores system preference', 'in_review', 4, 'm1', ['l4'], 11, 5, null, 'TS'],
  [133, 'Bulk edit for labels', 'backlog', 3, null, ['l6'], 12, null, null, 'TS'],
  [132, 'Avatar upload fails above 2 MB', 'todo', 3, 'm4', ['l1'], 13, 12, null, 'PY'],
  [131, 'Notification emails sent in UTC, not local time', 'done', 3, 'm5', ['l5'], 15, null, 3, 'GO'],
  [130, 'Memory leak in realtime subscription', 'in_progress', 1, 'm2', ['l3', 'l5'], 16, 0, null, 'GO'],
  [129, 'Inline code blocks lose formatting on paste', 'backlog', 4, 'm3', ['l4'], 17, null, null, 'TS'],
  [128, 'Mobile nav overlaps page header', 'done', 2, 'm4', ['l1', 'l4'], 18, null, 5, 'TS'],
  [127, 'Archive old cycles automatically', 'backlog', 0, null, ['l6'], 20, null, null, 'GO'],
  [126, 'Flaky test: billing proration edge case', 'todo', 3, 'm5', ['l5'], 22, 6, null, 'JAVA'],
  [125, 'Sidebar collapse state not remembered', 'done', 4, 'm1', ['l4'], 23, null, 8, 'TS'],
  [124, 'Image previews blurry on retina displays', 'canceled', 4, 'm4', ['l4'], 25, null, 10, 'TS'],
  [123, 'Slow cold start for API worker', 'done', 2, 'm2', ['l3'], 27, null, 12, 'GO'],
  [122, 'Date picker skips the 31st', 'done', 2, 'm3', ['l1', 'l2'], 29, null, 14, 'TS'],
  [121, 'GitHub sync misses renamed branches', 'in_review', 2, 'm5', ['l5'], 31, 1, null, 'GO'],
  [120, 'Add due dates to issues', 'done', 3, 'm1', ['l6'], 34, null, 18, 'TS'],
  [119, 'Typo in invite email subject', 'done', 4, 'm3', ['l1'], 36, null, 22, 'PY'],
  [118, 'Permissions page 500s for guests', 'done', 1, 'm2', ['l1', 'l5'], 38, null, 25, 'GO'],
  [117, 'Comment editor loses draft on navigation', 'todo', 3, 'm3', ['l1', 'l4'], 40, 10, null, 'TS'],
  [116, 'Reduce bundle size of issue view', 'backlog', 3, 'm4', ['l3', 'l4'], 43, null, null, 'RS'],
  [115, 'Timezone selector missing Kathmandu', 'done', 4, 'm5', ['l1'], 46, null, 30, 'GO'],
  [114, 'Stale cache after label rename', 'done', 2, 'm4', ['l1', 'l2'], 49, null, 33, 'GO'],
  [113, 'Keyboard focus lost after closing modal', 'done', 3, 'm1', ['l1', 'l4'], 52, null, 38, 'TS'],
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
  return ROWS.map(([number, title, status, priority, assigneeId, labelIds, created, dueIn, doneAgo, lang]) => {
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
      lang,
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
