'use client'

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  /** Stable id for the code input. */
  idPrefix: string
}

/**
 * Numeric one-time-code input. A single native field gives mobile browsers,
 * password managers, screen readers, paste, and deletion one reliable target.
 */
export function CodeInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = false,
  ariaLabel = 'Verification code',
  ariaDescribedBy,
  idPrefix,
}: CodeInputProps) {
  return (
    <input
      id={idPrefix}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={length}
      value={value}
      disabled={disabled}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onChange={(event) => {
        onChange(event.target.value.replace(/\D/g, '').slice(0, length))
      }}
      className="h-14 w-full border-0 border-b-2 border-slate-300 bg-transparent px-3 text-center font-mono text-3xl font-semibold tracking-[0.45em] text-slate-900 caret-emerald-600 transition-colors focus:border-emerald-600 focus:outline-none disabled:opacity-50"
    />
  )
}
