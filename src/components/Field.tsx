import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes, useId } from 'react'

import { cn } from '@/lib/cn'

const base =
  'w-full border bg-transparent text-fg placeholder:text-faint transition-colors duration-150 outline-none ' +
  'focus-visible:outline-none focus:border-fg/70 disabled:opacity-50'

type FieldProps = { label?: string; hint?: string; error?: string | null; icon?: ReactNode; inputSize?: 'sm' | 'md' }

/** Text input with optional label, leading icon, hint and error. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(function Input(
  { label, hint, error, icon, inputSize = 'md', className, id, ...rest },
  ref,
) {
  const auto = useId()
  const fid = id ?? auto
  const msg = error || hint
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={fid} className="text-[13px] text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint">{icon}</span>}
        <input
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={msg ? `${fid}-msg` : undefined}
          className={cn(
            base,
            inputSize === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-sm',
            icon ? 'pl-8 pr-3' : 'px-3',
            error ? 'border-blocked' : 'border-line hover:border-line-strong',
          )}
          {...rest}
        />
      </div>
      {msg && (
        <p id={`${fid}-msg`} className={cn('text-xs', error ? 'text-blocked' : 'text-faint')}>
          {msg}
        </p>
      )}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(
  function Textarea({ label, hint, error, className, id, ...rest }, ref) {
    const auto = useId()
    const fid = id ?? auto
    const msg = error || hint
    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label htmlFor={fid} className="text-[13px] text-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fid}
          aria-invalid={error ? true : undefined}
          aria-describedby={msg ? `${fid}-msg` : undefined}
          className={cn(base, 'min-h-24 resize-y px-3 py-2 text-sm leading-relaxed', error ? 'border-blocked' : 'border-line hover:border-line-strong')}
          {...rest}
        />
        {msg && (
          <p id={`${fid}-msg`} className={cn('text-xs', error ? 'text-blocked' : 'text-faint')}>
            {msg}
          </p>
        )}
      </div>
    )
  },
)
