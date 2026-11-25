import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/cn'
import { useFocusTrap } from './useFocusTrap'

type Props = {
  open: boolean
  onClose: () => void
  anchor: RefObject<HTMLElement | null>
  children: ReactNode
  align?: 'start' | 'end'
  width?: number
  className?: string
  label?: string
}

/**
 * Anchored floating panel. Positions under (or above, if there is no room)
 * its anchor, stays inside the viewport, closes on outside click and Escape,
 * traps focus while open and returns it to the anchor.
 */
export function Popover({ open, onClose, anchor, children, align = 'start', width = 240, className, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const a = anchor.current?.getBoundingClientRect()
      if (!a) return
      const h = ref.current?.offsetHeight ?? 280
      const vw = window.innerWidth
      const vh = window.innerHeight
      const w = Math.min(width, vw - 16)
      let left = align === 'end' ? a.right - w : a.left
      left = Math.max(8, Math.min(left, vw - w - 8))
      const up = a.bottom + 6 + h > vh - 8 && a.top - 6 - h > 8
      setPos({ top: up ? a.top - 6 - h : a.bottom + 6, left, up })
    }
    place()
    const raf = requestAnimationFrame(place)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, anchor, align, width])

  useLayoutEffect(() => {
    if (!open) return
    const down = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || anchor.current?.contains(t)) return
      onClose()
    }
    document.addEventListener('pointerdown', down)
    return () => document.removeEventListener('pointerdown', down)
  }, [open, onClose, anchor])

  useFocusTrap(ref, open, onClose)

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          initial={{ opacity: 0, y: pos?.up ? 4 : -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: Math.min(width, typeof window === 'undefined' ? width : window.innerWidth - 16) }}
          className={cn('fixed z-[70] border border-line-strong bg-raised shadow-pop outline-none', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
