'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle, ChevronDown, Shield } from 'lucide-react'
import { vaultSchema, type VaultFormData } from '@/lib/validations'
import faqData from '@/content/faq.json'

interface FaqItem {
  id: number
  category: string
  question: string
  answer: string
}

const categories = [
  'Menstrual Health',
  'Sexual Wellness',
  'Anatomy & Body',
  'Contraception',
  'Pregnancy & Fertility',
  'Other',
]

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: 'var(--color-border)' }}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50 sm:items-center sm:px-5"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="min-w-0 space-y-2 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
          <span
            className="inline-flex rounded-full px-2.5 py-1 font-body text-xs font-semibold"
            style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
          >
            {item.category}
          </span>
          <span className="block font-body text-sm font-semibold leading-6 text-slate-800">{item.question}</span>
        </span>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-emerald-800 transition-transform sm:mt-0 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="border-t px-4 py-4 sm:px-5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <p className="font-body text-sm leading-7 text-slate-700">{item.answer}</p>
        </div>
      ) : null}
    </div>
  )
}

export default function VaultForm() {
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<VaultFormData>({ resolver: zodResolver(vaultSchema) })

  const questionValue = useWatch({ control, name: 'question', defaultValue: '' })

  const onSubmit = async (data: VaultFormData) => {
    setErrorMessage('')
    setSubmitState('loading')

    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json().catch(() => null)

      if (!res.ok) {
        setErrorMessage(result?.error || 'Something went wrong. Please try again.')
        setSubmitState('error')
        return
      }

      setSubmitState('success')
      reset()
    } catch {
      setErrorMessage('Network error. Please try again.')
      setSubmitState('error')
    }
  }

  if (submitState === 'success') {
    return (
      <section className="rounded-lg border bg-white px-5 py-12 text-center sm:px-8" style={{ borderColor: 'var(--color-border)' }}>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="h-9 w-9 text-emerald-700" aria-hidden="true" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-emerald-950 sm:text-3xl">Question received</h2>
        <p className="mx-auto mt-3 max-w-md font-body text-sm leading-7 text-slate-600">
          Your question is now in review. Public handling stays anonymous, and private responses can be delivered inside your account.
        </p>
        <button
          type="button"
          onClick={() => setSubmitState('idle')}
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Ask another question
        </button>
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid min-w-0 gap-5 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
        <aside className="min-w-0 rounded-lg p-5 text-white sm:p-6" style={{ backgroundColor: 'var(--color-primary)' }}>
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
            <div>
              <h2 className="font-heading text-xl font-bold">Your public identity stays protected.</h2>
              <p className="mt-3 font-body text-sm leading-7" style={{ color: 'rgba(255,255,255,0.78)' }}>
                Your submission can be answered privately in your account. Public surfaces do not show your account identity, while internal safeguards control who can view it.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-white/15 pt-5 font-body text-sm text-white/80">
            <div className="flex items-center justify-between gap-3">
              <span>Public display</span>
              <span className="font-semibold text-white">Anonymous</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Private reply</span>
              <span className="font-semibold text-white">Account inbox</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Review access</span>
              <span className="font-semibold text-white">Admin guarded</span>
            </div>
          </div>
        </aside>

        <section className="min-w-0 rounded-lg border bg-white p-5 sm:p-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold leading-tight text-emerald-950 sm:text-3xl">
              Ask Dr. Didi anything
            </h2>
            <p className="mt-2 font-body text-sm leading-6 text-slate-500">
              Private account-linked support with anonymous public handling.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="vault-category">
                Category
              </label>
              <select
                id="vault-category"
                {...register('category')}
                className="input-field min-h-11"
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category ? (
                <p className="mt-1 font-body text-xs text-red-600">{errors.category.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block font-body text-sm font-semibold text-slate-700" htmlFor="vault-question">
                Your question
              </label>
              <textarea
                id="vault-question"
                {...register('question')}
                rows={6}
                placeholder="Type your question here. Add enough detail for a thoughtful answer."
                className="input-field min-h-36 resize-none"
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                {errors.question ? (
                  <p className="font-body text-xs text-red-600">{errors.question.message}</p>
                ) : (
                  <p className="font-body text-xs text-slate-400">Minimum 50 characters</p>
                )}
                <p className={`shrink-0 font-body text-xs ${questionValue.length > 450 ? 'text-red-600' : 'text-slate-400'}`}>
                  {questionValue.length}/500
                </p>
              </div>
            </div>

            {submitState === 'error' ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3" role="alert">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                <p className="font-body text-sm leading-6 text-red-700">
                  {errorMessage || 'Something went wrong. Please try again.'}
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitState === 'loading'}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              {submitState === 'loading' ? 'Sending...' : 'Submit anonymously'}
            </button>
          </form>
        </section>
      </div>

      <section>
        <div className="mb-4">
          <h2 className="font-heading text-2xl font-bold text-emerald-950">Common questions</h2>
          <p className="mt-1 font-body text-sm text-slate-500">Browse questions Dr. Didi has already answered.</p>
        </div>
        <div className="space-y-3">
          {(faqData as FaqItem[]).map((item) => (
            <FaqAccordionItem key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
