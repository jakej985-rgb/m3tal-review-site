import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useRef } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/cn'
import { useFocusTrap } from './useFocusTrap'

/** Slide-over panel from the right (or left for navigation). Focus-trapped, Escape and scrim close it. */
export function Drawer({ open, onClose, title, children, side = 'right', width = 440, className }: { open: boolean; onClose: () => void; title: string; children: ReactNode; side?: 'left' | 'right'; width?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, open, onClose)
  const x = side === 'right' ? '100%' : '-100%'
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} aria-hidden />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ x }}
            animate={{ x: 0 }}
            exit={{ x }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: `min(${width}px, 100vw)` }}
            className={cn('absolute inset-y-0 flex flex-col bg-surface outline-none', side === 'right' ? 'right-0 border-l border-line-strong' : 'left-0 border-r border-line-strong', className)}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
