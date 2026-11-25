# Triage

A near-black, square-cornered bug tracker: a landing page (hero with a
wireframe stack of hatched slabs, a live product shot, features, changelog,
pricing) and a working tracker at `/app`. Issues are grouped by status, with
filters, search, keyboard navigation, a board you can drag between, a ⌘K
command palette, an inbox, insights and settings. Light theme included.

Data lives in the browser (`localStorage`), so there is no sign-in or
database yet. The store is one module, built to be swapped for D1 later (see
"Move to D1" below).

## Run it

```sh
bun install
bun run dev        # http://localhost:5189 (Vite + the Worker in workerd)
bun run build      # dist/client (assets) + dist/bug_tracker/index.js (Worker)
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

- `src/data.ts` holds every string (hero, features, changelog, pricing,
  footer), the status and priority vocabulary, label colours, and the demo
  workspace (members, labels, 30 issues, cycles, inbox). Start there.
- `src/app/store.ts` is the data layer: state shape, every action
  (`createIssue`, `patchIssue`, `addComment`, labels, members…), filtering and
  sorting. Saved to `localStorage` key `triage:v1`; view preferences under
  `triage:prefs`; theme under `triage:theme`.
- `src/app/*` are the screens: `TrackerApp` (shell, routing, shortcuts),
  `Sidebar`, `IssuesView` (list/board host, toolbar, j/k), `IssueList`,
  `Board`, `DetailPane`, `IssueModal`, `CommandPalette`, `Inbox`, `Insights`,
  `Settings`; `props.tsx` has the status / priority / assignee / labels /
  cycle / due pickers shared by all of them.
- `src/sections/*` are the site: `Landing` (nav, hero, features, changelog,
  pricing, CTA, footer), `IsoStack` (the hero's 3D wireframe), `ProductMock`
  (the interactive skeleton product shot), `NotFound`.
- `src/worker/index.ts` is the Worker: `/api/health`, `/api/subscribe`
  (changelog email, validates and acknowledges; returns 400 on a bad address)
  and a JSON 404 for unknown `/api/*`.
- There are no photos. Avatars are generated SVG (`Avatar.tsx`); to use real
  pictures, add a `photo` field to `Member` in `src/data.ts` and render an
  `<img>` in `Avatar` when it is set.

### Move to D1

Every mutation goes through one `update()` in `store.ts`, and state is plain
JSON. To persist on the server: add a `DB` binding in `wrangler.jsonc`,
create `issues`, `comments`, `labels`, `members` tables, add routes in
`src/worker/index.ts`, then make each action call its route (keep the local
update for optimistic UI) and replace `load()` with a fetch.

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
