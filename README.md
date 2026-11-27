# M3TAL Review

The site and demo tracker for **M3TAL Review** — AI-less code review that never
guesses: a landing page (hero with a wireframe stack of hatched slabs, a live
product shot, features, changelog, pricing) and a working tracker at `/app`.

Findings are keyed the way the CLI keys them, `REV-GO-142`: `REV`, then the
language of the code under review, then the number. The language is stored on
the issue (`Issue.lang`), so editing labels never changes a key, and the
new-issue form has a picker for it. Issues are grouped by status, with filters,
search, keyboard navigation, a board you can drag between, a ⌘K command palette,
an inbox, insights and settings. Light theme included. There is one plan, free,
and it links to the repository.

Signed out, the tracker is a browser-only demo in `localStorage`. Signed in
with Freebuff, the workspace belongs to the account and is stored in D1 under
the visitor's `sub`, so it follows them to another browser; saves are
optimistic, one at a time, and a tab that has fallen behind adopts the newer
copy instead of overwriting it (see "Storage and accounts").

## Run it

```sh
bun install
bun run dev        # http://localhost:5189 (Vite + the Worker in workerd)
bun run build      # dist/client (assets) + dist/m3tal_review/index.js (Worker)
bun run typecheck
```

Routes: `/` landing, `/app` issues (list), `/app/board`, `/app/inbox`,
`/app/insights`, `/app/settings`, `/styleguide` (the design system, live),
anything else is the 404 page. `/app?issue=142` opens an issue;
`/app?mine=1` and `/app?cycle=cy2` are the sidebar views.

Keyboard in the app: `j` / `k` (or arrows) move through the list, `Enter`
opens, `Esc` closes, `c` creates an issue, `/` searches, `⌘K` / `Ctrl K`
opens the command palette. In pickers, type to filter, arrows to move,
`Enter` or `1`–`9` to choose. `⌘Enter` submits the issue form and comments.

## Edit it

- `src/data.ts` holds every string the site and app show — `BRAND` (name,
  key prefix, workspace, tagline, repo URL), hero, features, changelog,
  pricing, footer — plus the status, priority and language vocabulary
  (`LANGS`, which types `Issue.lang` and labels the key picker), label
  colours, and the demo workspace (members, labels, 30 issues, cycles,
  inbox). Start there.
- `src/app/store.ts` is the data layer: state shape, every action
  (`createIssue`, `patchIssue`, `addComment`, labels, members…), filtering and
  sorting, and the `REV-<lang>-<n>` key format. Signed out it persists to
  `localStorage` in three keys that share the `m3tal-review:` prefix: `:v1`
  (the workspace), `:prefs` (grouping, collapsed sections, closed issues, in
  `TrackerApp.tsx`) and `:theme` (in `src/lib/theme.ts`, and also read by the
  inline script in `index.html` that applies the theme before first paint, so
  change the two together). Signed in, the same module loads and saves through
  `/api/state` instead.
- `src/components/AccountMenu.tsx` holds the account controls: the header's
  Log in / Sign up links (both start Sign in with Freebuff, which creates
  accounts and signs existing ones in) and the sidebar row that says whether
  edits are saved to the account or only to this browser.
- `src/app/*` are the screens: `TrackerApp` (shell, routing, shortcuts),
  `Sidebar`, `IssuesView` (list/board host, toolbar, j/k), `IssueList`,
  `Board`, `DetailPane`, `IssueModal`, `CommandPalette`, `Inbox`, `Insights`,
  `Settings`; `props.tsx` has the status / priority / language / assignee /
  labels / cycle / due pickers shared by all of them.
- `src/sections/*` are the site: `Landing` (nav, hero, features, changelog,
  pricing, CTA, footer), `IsoStack` (the hero's 3D wireframe), `ProductMock`
  (the interactive skeleton product shot), `NotFound`.
- `src/worker/index.ts` is the Worker: `/api/health`, `/api/me`
  (`{ available, user }`), `/api/state` (the signed-in visitor's workspace,
  `GET`/`PUT`), `/api/subscribe` (changelog email; validates, then returns 501
  because no list is wired up) and a JSON 404 for unknown `/api/*`. The handler
  is wrapped by `@freebuff/auth`, which also serves
  `/auth/freebuff/{signin,callback,signout,session}`.
- There are no photos. Avatars are generated SVG (`Avatar.tsx`); to use real
  pictures, add a `photo` field to `Member` in `src/data.ts` and render an
  `<img>` in `Avatar` when it is set.
- The board's drag payload uses the MIME type
  `application/x-m3tal-review-issue`, read back on drop in `Board.tsx`.

### Storage and accounts

`workspaces(user_id PRIMARY KEY, state TEXT, updated_at INTEGER)` holds one
JSON workspace per account, keyed by the Freebuff `sub` — never an ID from the
request body. The table is created on first use, and a request without a
session gets 401, while a state-changing request from another origin gets 403.

Saving is optimistic and single-flight: the client sends the `updatedAt` it
last saw, the Worker applies the write only when that still matches (strictly
increasing timestamps, so two saves in one millisecond still order), and a
stale tab gets 409 with the newer copy. That tab merges what it changed since
the server last acknowledged a copy — an issue it added or edited wins, a
deletion here sticks, everything else comes from the newer copy, and an issue
number both sides handed out is renumbered here — then saves the result. One
save is in flight at a time; edits made meanwhile coalesce into the next, and
`pagehide` writes only when something is still unsaved. If a merged copy is
rejected three times, the newest copy wins instead of looping, and the copy
that lost is parked in this browser under `m3tal-review:kept:<sub>`, filed by
the account that was saving, so signing in as someone else here neither shows
nor restores it. The sidebar row says so and offers **Restore** (put those
edits back and save them over the account's copy) and **Discard** (forget
them). A restore keeps the record until its save is acknowledged, so a failed
or interrupted one can be tried again; discarding clears it straight away.

A save refused with 401 means the session ended: the client stops writing,
keeps the workspace in this browser and asks for a sign-in. That copy is
recorded in `m3tal-review:resume` (account `sub` plus the `updatedAt` it was
based on), and the next sign-in replays it to the account before the account's
own copy is loaded. If the account changed in the meantime the replay is
refused, the newer account copy wins, and the browser copy is left in place.

For a normalised schema (per-issue rows, comments as their own table), replace
the JSON row with tables and turn each action in `store.ts` into its route,
keeping the local update for the optimistic UI and moving the `updatedAt`
check to the row you mutate. To use email/password or another provider instead,
swap `@freebuff/auth` for it and keep the same `user.sub`-scoped queries; add
the production client with `sites_enable_auth` for the deployed origin, and a
development one for `localhost`.

## Design system

The live reference is **`/styleguide`**: every token and every component in
`src/components/`, in all variants and states (pinned with `data-force`), in
both themes. Footer link: Resources → Style guide.

### Tokens (`src/styles.css`)

Colours are CSS variables per theme (`:root` / `[data-theme='dark']` and
`[data-theme='light']`), read by Tailwind through `@theme inline`, so
utilities like `bg-surface` follow the theme with no `dark:` variants.

| Token | Use |
| --- | --- |
| `bg`, `surface`, `surface-2`, `raised` | Page, panels, hover/selected, popovers |
| `line`, `line-strong` | Hairlines, outlines and inputs |
| `fg`, `muted`, `faint` | Text, strongest to quietest |
| `skel` | Skeleton bars |
| `invert`, `invert-fg` | The light-grey primary button and its text |
| `backlog` … `canceled` | Status colours (always with an icon) |
| `--c-chart-open/closed` | Insights series (palette checked for CVD and contrast) |
| `--radius-frame` | 14px, only the product-shot frame; everything else is square |
| `--shadow-pop`, `--shadow-modal` | Floating layers only |
| `.hatch`, `.hatch-strong` | Diagonal hairline hatch: selected rows, drop targets |
| `DUR`, `EASE` (`src/lib/motion.ts`) | 120 / 200 / 400 / 800 ms, out-quint and snap |

Fonts: Geist and Geist Mono from Google Fonts (`index.html`), system
fallbacks. `hover:`, `active:` and `focus-visible:` also match
`data-force="hover|active|focus"`, which is how the style guide pins states.

### Components (`src/components/`)

`Button` / `ButtonLink` (primary, outline, ghost, danger; sm/md/lg; loading),
`IconButton`, `ToolbarButton`, `Input` / `Textarea` (label, icon, hint,
error), `Switch`, `SegmentedControl` (sliding thumb, arrow keys), `Badge`,
`LabelChip` (swatch or icon, removable), `Kbd`, `StatusIcon`, `PriorityIcon`
(bars or dot), `DueBadge`, `Avatar`, `Popover` (anchored, flips, traps
focus), `SelectMenu` (searchable listbox), `Picker` (trigger + both),
`Modal`, `Drawer`, `Toast` (with Undo), `Skeleton`, `Spinner`, `EmptyState`,
`Panel`, `StatTile`, `SectionHead`, `Logo`, `ThemeToggle`. Overlays share
`useFocusTrap`, which stacks so the innermost overlay handles Escape first.

Motion uses `motion`: the headline and hero fade up, the slab stack drifts
and leans toward the pointer, the product shot's selection glides between
rows, sections reveal on scroll, rows and cards animate in and out, popovers
and dialogs spring, and the board highlights drop targets. All of it stops
under `prefers-reduced-motion`.
