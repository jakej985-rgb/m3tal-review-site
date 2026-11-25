import { Check, Search } from 'lucide-react'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { Kbd } from './Kbd'

export type MenuOption<V extends string | number> = {
  value: V
  label: string
  icon?: ReactNode
  hint?: string
  keywords?: string
}

type Props<V extends string | number> = {
  options: MenuOption<V>[]
  selected: V[]
  onSelect: (v: V) => void
  placeholder?: string
  multi?: boolean
  label: string
  footer?: ReactNode
  empty?: string
}

/**
 * Searchable listbox for property pickers and filters. Type to filter, arrows
 * to move, Enter to pick; number keys 1–9 pick directly when the field is empty.
 */
export function SelectMenu<V extends string | number>({ options, selected, onSelect, placeholder = 'Search…', multi, label, footer, empty = 'No matches' }: Props<V>) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const id = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Focus the field on mount, including when a parent swaps menus in place.
  useEffect(() => inputRef.current?.focus({ preventScroll: true }), [])
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? options.filter((o) => `${o.label} ${o.keywords ?? ''}`.toLowerCase().includes(s)) : options
  }, [q, options])

  useEffect(() => setActive(0), [q])
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-line px-3">
        <Search className="size-3.5 text-faint" aria-hidden />
        <input
          ref={inputRef}
          data-autofocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          role="combobox"
          aria-expanded
          aria-controls={`${id}-list`}
          aria-activedescendant={shown[active] ? `${id}-${active}` : undefined}
          className="h-10 w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, shown.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              if (shown[active]) onSelect(shown[active].value)
            } else if (!q && /^[1-9]$/.test(e.key) && shown[Number(e.key) - 1]) {
              e.preventDefault()
              onSelect(shown[Number(e.key) - 1].value)
            }
          }}
        />
      </div>
      <ul ref={listRef} id={`${id}-list`} role="listbox" aria-label={label} aria-multiselectable={multi || undefined} className="max-h-72 overflow-y-auto py-1">
        {shown.length === 0 && <li className="px-3 py-3 text-[13px] text-faint">{empty}</li>}
        {shown.map((o, i) => {
          const on = selected.includes(o.value)
          return (
            <li
              key={String(o.value)}
              id={`${id}-${i}`}
              data-i={i}
              role="option"
              aria-selected={on}
              onPointerMove={() => setActive(i)}
              onClick={() => onSelect(o.value)}
              className={cn('mx-1 flex h-9 cursor-pointer items-center gap-2.5 px-2 text-[13px] text-fg', i === active && 'bg-surface-2')}
            >
              {multi && (
                <span className={cn('flex size-3.5 items-center justify-center border', on ? 'border-fg bg-fg text-bg' : 'border-line-strong')} aria-hidden>
                  {on && <Check className="size-3" strokeWidth={3} />}
                </span>
              )}
              {o.icon}
              <span className="flex-1 truncate">{o.label}</span>
              {o.hint && <span className="text-xs text-faint">{o.hint}</span>}
              {!multi && on && <Check className="size-3.5 text-muted" aria-hidden />}
              {!q && i < 9 && <Kbd className="h-4 min-w-4 border-line text-[10px] text-faint">{i + 1}</Kbd>}
            </li>
          )
        })}
      </ul>
      {footer}
    </div>
  )
}
