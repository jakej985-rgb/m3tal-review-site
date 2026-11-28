import { cn } from '@/lib/cn'

/** The flat grey bars the reference uses for placeholder text. */
export function Skeleton({ w, h = 7, className, shimmer }: { w: number | string; h?: number; className?: string; shimmer?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn('block bg-skel', shimmer && 'hatch animate-hatch', className)}
      style={{ width: typeof w === 'number' ? `${w}px` : w, height: h }}
    />
  )
}
