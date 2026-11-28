import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/cn'
import { IconButton } from './IconButton'
import { useFocusTrap } from './useFocusTrap'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  /** Hide the visible header (the title stays as the accessible name). */
  bare?: boolean
  children: ReactNode
  footer?: ReactNode
  width?: number
  position?: 'center' | 'top'
  className?: string
}

/** Square dialog over a dimmed scrim. Focus is trapped and restored; Escape and the scrim close it. */
export function Modal({ open, onClose, title, bare, children, footer, width = 560, position = 'center', className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, open, onClose)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-[60] flex justify-center p-3 sm:p-6', position === 'top' ? 'items-start pt-[12vh]' : 'items-center')}>
          <motion.div className="absolute inset-0 bg-scrim backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={onClose} aria-hidden />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ maxWidth: width }}
            className={cn('relative flex max-h-[calc(100dvh-24px)] w-full flex-col border border-line-strong bg-surface shadow-modal outline-none', className)}
          >
            {!bare && (
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-line pr-1.5 pl-4">
                <h2 className="text-sm font-medium">{title}</h2>
                <IconButton label="Close" size="sm" onClick={onClose}>
                  <X className="size-4" />
                </IconButton>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer && <div className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
