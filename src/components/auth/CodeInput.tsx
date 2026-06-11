'use client'

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  /** Stable prefix for the generated per-cell input ids. */
  idPrefix: string
}

/**
 * Segmented numeric code entry — one crisp cell per digit, with full keyboard
 * and paste handling. Renders sharp underline cells rather than a single boxy
 * field. `onChange` always receives the joined digit string.
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
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus()
    }
  }, [autoFocus])

  const focusCell = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index))
    const cell = inputsRef.current[clamped]
    cell?.focus()
    cell?.select()
  }

  const writeFrom = (index: number, chars: string[]) => {
    const next = digits.slice()
    chars.forEach((char, offset) => {
      if (index + offset < length) {
        next[index + offset] = char
      }
    })
    onChange(next.join('').slice(0, length))
    focusCell(index + chars.length)
  }

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      const next = digits.slice()
      next[index] = ''
      onChange(next.join(''))
      return
    }
    writeFrom(index, cleaned.split(''))
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        const next = digits.slice()
        next[index] = ''
        onChange(next.join(''))
      } else if (index > 0) {
        event.preventDefault()
        const next = digits.slice()
        next[index - 1] = ''
        onChange(next.join(''))
        focusCell(index - 1)
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusCell(index - 1)
    } else if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault()
      focusCell(index + 1)
    }
  }

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '')
    if (pasted) {
      writeFrom(index, pasted.split(''))
    }
  }

  return (
    <div className="flex gap-2 sm:gap-2.5" role="group" aria-label={ariaLabel}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          id={`${idPrefix}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`${ariaLabel} digit ${index + 1}`}
          aria-describedby={ariaDescribedBy}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          className="h-14 w-full min-w-0 border-0 border-b-2 border-slate-300 bg-transparent text-center font-mono text-3xl font-semibold text-slate-900 caret-emerald-600 transition-colors focus:border-emerald-600 focus:outline-none disabled:opacity-50"
        />
      ))}
    </div>
  )
}
