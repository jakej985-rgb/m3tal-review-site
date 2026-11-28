import type { Member } from '@/data'
import { cn } from '@/lib/cn'

const SIZES = { xs: 18, sm: 22, md: 28, lg: 40 } as const

/**
 * Generated SVG avatar: a dark disc, a hue-tinted geometric shape picked from
 * the member's id, and their initials. Swap in photos by rendering an <img>
 * here when `member.photo` exists.
 */
export function Avatar({ member, size = 'sm', className, decorative }: { member: Member | null | undefined; size?: keyof typeof SIZES; className?: string; decorative?: boolean }) {
  const a11y = decorative ? ({ 'aria-hidden': true } as const) : ({ role: 'img', 'aria-label': member?.name ?? 'Unassigned' } as const)
  const px = SIZES[size]
  if (!member) {
    return (
      <svg width={px} height={px} viewBox="0 0 24 24" className={cn('shrink-0 text-faint', className)} {...a11y}>
        <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeDasharray="2.5 2.5" />
        <circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" />
        <path d="M6.5 18c1.2-2.4 3.2-3.6 5.5-3.6s4.3 1.2 5.5 3.6" fill="none" stroke="currentColor" />
      </svg>
    )
  }
  const seed = [...member.id].reduce((a, c) => a + c.charCodeAt(0), 0)
  const shape = seed % 3
  const initials = member.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const base = `hsl(${member.hue} 22% 20%)`
  const tint = `hsl(${member.hue} 70% 62%)`
  const clip = `av-${member.id}`
  return (
    <svg width={px} height={px} viewBox="0 0 24 24" className={cn('shrink-0', className)} {...a11y}>
      {!decorative && <title>{member.name}</title>}
      <clipPath id={clip}>
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect width="24" height="24" fill={base} />
        {shape === 0 && <circle cx="20" cy="20" r="11" fill={tint} opacity="0.55" />}
        {shape === 1 && <path d="M0 24 L24 6 L24 24 Z" fill={tint} opacity="0.5" />}
        {shape === 2 && <rect x="-4" y="14" width="32" height="12" transform="rotate(-18 12 18)" fill={tint} opacity="0.5" />}
      </g>
      {px >= 22 && (
        <text aria-hidden="true" x="12" y="12.5" textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="600" fill="#fff" fontFamily="Geist, sans-serif">
          {initials}
        </text>
      )}
    </svg>
  )
}
