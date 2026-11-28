import { type RefObject, useEffect } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Open overlays, innermost last. Only the top one reacts to Escape and Tab,
// so a popover inside a modal closes first.
const stack: symbol[] = []

/**
 * While `active`, keeps Tab inside `ref`, calls `onEscape` on Escape, and puts
 * focus back where it was when the overlay closes.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void, opts: { autoFocus?: boolean } = {}) {
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement as HTMLElement | null
    const me = Symbol('trap')
    stack.push(me)
    const node = ref.current
    if (node && opts.autoFocus !== false && !node.contains(document.activeElement)) {
      const preferred = node.querySelector<HTMLElement>('[data-autofocus]') ?? node.querySelector<HTMLElement>(FOCUSABLE)
      ;(preferred ?? node).focus({ preventScroll: true })
    }
    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== me) return
      if (e.key === 'Escape' && onEscape) {
        e.stopPropagation()
        e.preventDefault()
        onEscape()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      stack.splice(stack.indexOf(me), 1)
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
