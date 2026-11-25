import { AnimatePresence, motion } from 'motion/react'
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react'

type Toast = { id: number; title: string; action?: { label: string; run: () => void } }
type Ctx = (t: Omit<Toast, 'id'>) => void

const ToastCtx = createContext<Ctx>(() => {})
export const useToast = () => useContext(ToastCtx)

let seq = 0

/** Bottom-left stack of square toasts with an optional action (Undo). Auto-dismiss after 5 s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const dismiss = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id))
  const push = useCallback<Ctx>((t) => {
    const id = ++seq
    setItems((xs) => [...xs.slice(-2), { ...t, id }])
    window.setTimeout(() => dismiss(id), 5000)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[80] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -24, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex items-center gap-3 border border-line-strong bg-raised px-4 py-3 text-[13px] shadow-pop"
            >
              <span className="flex-1">{t.title}</span>
              {t.action && (
                <button
                  type="button"
                  className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg"
                  onClick={() => {
                    t.action!.run()
                    dismiss(t.id)
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" onClick={() => dismiss(t.id)} className="text-faint hover:text-fg" aria-label="Dismiss">
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}
