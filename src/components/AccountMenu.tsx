import { SignInWithFreebuff, SignOutButton } from '@freebuff/auth/react'

import { Avatar } from '@/components/Avatar'
import { Button, buttonClass } from '@/components/Button'
import { NAV } from '@/data'
import { ago } from '@/lib/dates'
import { discardKeptCopy, restoreKeptCopy, useAuth, useKeptCopy, useStore } from '@/app/store'

/*
  Account controls. Signed out, the header's "Log in" and "Sign up" both start
  Sign in with Freebuff, which creates accounts and signs existing ones in; the
  tracker stays explorable as a browser-only demo either way.
*/

export function HeaderAccount() {
  const { user, ready, available } = useAuth()
  // Reserve the space so the nav does not jump when the session arrives.
  if (!ready) return <span className="hidden h-10 w-[132px] sm:inline-block" aria-hidden />
  // No client ID in this environment (local dev): sign-in cannot work, so offer nothing.
  if (!available) return null
  if (!user) {
    return (
      <>
        <SignInWithFreebuff returnTo="/app" className="hidden h-10 items-center px-3 text-[15px] text-muted transition-colors hover:text-fg sm:inline-flex">
          {NAV.login}
        </SignInWithFreebuff>
        <SignInWithFreebuff returnTo="/app" className={buttonClass('outline', 'md', 'h-10 px-[18px] text-[15px]')}>
          {NAV.signup}
        </SignInWithFreebuff>
      </>
    )
  }
  return (
    <span className="flex items-center gap-1 sm:gap-2">
      <span className="hidden max-w-[150px] truncate text-[15px] text-muted sm:inline" title={user.email ?? undefined}>
        {user.name ?? user.email ?? 'Signed in'}
      </span>
      <SignOutButton returnTo="/" className="inline-flex h-10 items-center px-3 text-[15px] text-muted transition-colors hover:text-fg">
        Sign out
      </SignOutButton>
    </span>
  )
}

/** The tracker's account row: who you are, and whether edits leave this browser. */
export function SidebarAccount() {
  const { user, ready, error, available, expired } = useAuth()
  const kept = useKeptCopy()
  const me = useStore((s) => s.members.find((m) => m.id === s.meId))
  // Signed in, the avatar is the account's, not the demo persona's.
  const avatar = user
    ? {
        id: user.sub,
        name: user.name ?? user.email ?? 'You',
        handle: user.sub.slice(0, 6),
        hue: [...user.sub].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 360,
      }
    : me
  const status = !ready ? 'Checking…' : !available ? me?.name : user ? 'Saved to your account' : expired ? 'Session expired — this browser only' : 'Demo — this browser only'

  return (
    <div className="mt-2 px-2.5 py-1.5">
      <div className="flex items-center gap-2.5">
        <Avatar member={avatar} size="sm" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{ready && user ? (user.name ?? user.email ?? me?.name) : (me?.name ?? 'Demo')}</span>
        {ready &&
          available &&
          (user ? (
            <SignOutButton returnTo="/" className="inline-flex min-h-8 shrink-0 items-center text-xs text-muted hover:text-fg">
              Sign out
            </SignOutButton>
          ) : (
            <SignInWithFreebuff returnTo="/app" className="inline-flex min-h-8 shrink-0 items-center text-xs text-muted hover:text-fg">
              {expired ? 'Sign in again' : 'Sign in'}
            </SignInWithFreebuff>
          ))}
      </div>
      {/* Under the row rather than in it: the button beside the name leaves too little
          width for the status at 232px, and the drawer is only a little wider. */}
      <p className="mt-0.5 pl-[32px] text-[11px] leading-snug text-faint">{status}</p>
      {error && (
        <p role="status" className="mt-1.5 text-[11px] leading-snug text-danger">
          {error}
        </p>
      )}
      {kept && (
        <div className="mt-2 border border-line-strong/70 bg-surface-2/50 px-2 py-1.5">
          <p className="text-[11px] leading-snug text-muted">Edits kept {ago(kept.savedAt)}, when a save could not be applied.</p>
          {/* Equal halves: a ghost Discard beside an outlined Restore read as plain
              text, and the pair should look like two choices of the same weight. */}
          <div className="mt-1.5 flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={restoreKeptCopy} className="h-7 flex-1 px-2 text-[12px]">
              Restore
            </Button>
            <Button size="sm" variant="outline" onClick={discardKeptCopy} className="h-7 flex-1 px-2 text-[12px] text-muted">
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
