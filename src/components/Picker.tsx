import { type ReactNode, useRef, useState } from 'react'

import { Popover } from './Popover'
import { type MenuOption, SelectMenu } from './SelectMenu'

type Props<V extends string | number> = {
  label: string
  options: MenuOption<V>[]
  selected: V[]
  onSelect: (v: V) => void
  multi?: boolean
  placeholder?: string
  align?: 'start' | 'end'
  width?: number
  children: (props: { onClick: () => void; 'aria-haspopup': 'dialog'; 'aria-expanded': boolean }) => ReactNode
}

/**
 * A trigger + Popover + SelectMenu. Single pickers close after a choice;
 * multi pickers stay open. The trigger is rendered by the caller.
 */
export function Picker<V extends string | number>({ label, options, selected, onSelect, multi, placeholder, align, width = 240, children }: Props<V>) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLSpanElement>(null)
  return (
    <>
      <span ref={anchor} className="flex min-w-0 max-w-full">
        {children({ onClick: () => setOpen((o) => !o), 'aria-haspopup': 'dialog', 'aria-expanded': open })}
      </span>
      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} align={align} width={width} label={label}>
        <SelectMenu
          label={label}
          options={options}
          selected={selected}
          multi={multi}
          placeholder={placeholder}
          onSelect={(v) => {
            onSelect(v)
            if (!multi) setOpen(false)
          }}
        />
      </Popover>
    </>
  )
}
