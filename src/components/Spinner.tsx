import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={cn('animate-spin-slow', className)} aria-hidden>
      <rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M1.5 1.5h13" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
