'use client'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Shield, CheckCircle, AlertCircle } from 'lucide-react'
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
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-white transition-colors hover:bg-gray-50"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="shrink-0 text-xs font-body font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
          >
            {item.category}
          </span>
          <span className="font-body font-semibold text-gray-800 text-sm truncate">{item.question}</span>
        </div>
        <span
          className="ml-4 shrink-0 transition-transform duration-200 text-xs"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--color-primary)',
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div className="px-6 py-4 border-t" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <p className="font-body text-gray-700 text-sm leading-relaxed">{item.answer}</p>
        </div>
      )}
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
      <div className="text-center py-16">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: '#dcfce7' }}
        >
          <CheckCircle size={40} style={{ color: '#16a34a' }} />
        </div>
        <h3 className="font-heading font-bold text-3xl mb-4" style={{ color: 'var(--color-primary)' }}>
          Question Received!
        </h3>
        <p className="font-body text-gray-600 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Your question is now in review. We keep it anonymous for public discussion while using your account only to deliver private responses.
        </p>
        <button
          onClick={() => setSubmitState('idle')}
          className="font-body font-semibold px-8 py-3 rounded-full transition-colors"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          Ask Another Question
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Privacy banner */}
      <div className="text-white rounded-2xl p-6 mb-8 flex items-start gap-4" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Shield size={24} className="shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
        <div>
          <h3 className="font-body font-semibold mb-1">Your public identity stays protected.</h3>
          <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Your submission can be answered privately in your account. It remains anonymous on public surfaces, while internal safeguards control who can view account identity.
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        className="bg-white rounded-2xl border p-8 mb-12"
        style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <h2 className="font-heading font-bold text-3xl mb-1" style={{ color: 'var(--color-primary)' }}>
          Ask Dr. Didi Anything
        </h2>
        <p className="font-body text-gray-500 text-sm mb-8">Private account-linked support with anonymous public handling.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block font-body font-semibold text-sm text-gray-700 mb-2">Category</label>
            <select
              {...register('category')}
              className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              <option value="">Select a category…</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1 font-body">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block font-body font-semibold text-sm text-gray-700 mb-2">Your Question</label>
            <textarea
              {...register('question')}
              rows={5}
              placeholder="Type your question here… Be as detailed as you need — Dr. Didi will give a thorough answer."
              className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none resize-none"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
            />
            <div className="flex justify-between mt-1">
              {errors.question ? (
                <p className="text-red-500 text-xs font-body">{errors.question.message}</p>
              ) : (
                <p className="text-xs text-gray-400 font-body">Minimum 50 characters</p>
              )}
              <p className={`text-xs font-body ${questionValue.length > 450 ? 'text-red-500' : 'text-gray-400'}`}>
                {questionValue.length}/500
              </p>
            </div>
          </div>

          {submitState === 'error' && (
            <div
              className="flex items-center gap-2 rounded-xl p-4 border"
              style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}
            >
              <AlertCircle size={18} style={{ color: '#dc2626' }} />
              <p className="font-body text-sm" style={{ color: '#b91c1c' }}>
                {errorMessage || 'Something went wrong. Please try again.'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitState === 'loading'}
            className="w-full flex items-center justify-center gap-2 font-body font-semibold py-4 rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            <Shield size={18} />
            {submitState === 'loading' ? 'Sending…' : '🔒 Submit Anonymously'}
          </button>
        </form>
      </div>

      {/* FAQ */}
      <div>
        <div className="text-center mb-8">
          <h2 className="font-heading font-bold text-3xl mb-2" style={{ color: 'var(--color-primary)' }}>
            Common Questions
          </h2>
          <p className="font-body text-gray-500 text-sm">
            Browse questions Dr. Didi has already answered.
          </p>
        </div>
        <div className="space-y-3">
          {(faqData as FaqItem[]).map((item) => (
            <FaqAccordionItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}
