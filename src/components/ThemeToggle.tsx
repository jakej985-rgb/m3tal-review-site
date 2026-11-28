import { Moon, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import { toggleTheme, useTheme } from '@/lib/theme'
import { IconButton } from './IconButton'

export function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const theme = useTheme()
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  return (
    <IconButton label={label} onClick={toggleTheme} size={size} className="overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 14, opacity: 0, rotate: -30 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 30 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex"
        >
          {theme === 'dark' ? <Moon className={size === 'sm' ? 'size-4' : 'size-[22px]'} strokeWidth={1.6} /> : <Sun className={size === 'sm' ? 'size-4' : 'size-[22px]'} strokeWidth={1.6} />}
        </motion.span>
      </AnimatePresence>
    </IconButton>
  )
}
