import { motion } from 'motion/react'

import { cn } from '@/lib/cn'

/** Square on/off switch. */
export function Switch({ checked, onChange, label, disabled, className }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center border p-0.5 transition-colors duration-150 disabled:opacity-40',
        'hit',
        checked ? 'border-fg bg-fg' : 'border-line-strong bg-transparent hover:border-muted',
        className,
      )}
    >
      <motion.span
        className={cn('block size-3.5', checked ? 'bg-bg' : 'bg-muted')}
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: 'spring', stiffness: 700, damping: 40 }}
      />
    </button>
  )
}
