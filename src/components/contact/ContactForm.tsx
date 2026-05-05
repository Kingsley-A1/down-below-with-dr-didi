'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { contactSchema, type ContactFormData } from '@/lib/validations'

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
]

const fieldStyle = {
  borderColor: 'var(--color-border)',
  backgroundColor: 'var(--color-surface)',
}

export default function ContactForm({
  contactEmail,
  primaryWhatsapp,
}: {
  contactEmail: string
  primaryWhatsapp: string
}) {
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) })

  const onSubmit = async (data: ContactFormData) => {
    setSubmitState('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setSubmitState(res.ok ? 'success' : 'error')
      if (res.ok) reset()
    } catch {
      setSubmitState('error')
    }
  }

  if (submitState === 'success') {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#dcfce7' }}>
          <CheckCircle size={40} style={{ color: '#16a34a' }} />
        </div>
        <h3 className="font-heading font-bold text-3xl mb-4" style={{ color: 'var(--color-primary)' }}>
          Request Saved
        </h3>
        <p className="font-body text-gray-600 mb-2 max-w-sm mx-auto text-sm">
          Your consultation request has been recorded in the system.
        </p>
        <p className="font-body text-gray-400 text-xs mb-8">
          For faster follow-up, continue the conversation on WhatsApp or Gmail.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <a
            href={primaryWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body font-semibold px-8 py-3 rounded-full"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
          >
            Open WhatsApp
          </a>
          <a
            href={`mailto:${contactEmail}`}
            className="font-body font-semibold px-8 py-3 rounded-full border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
          >
            Send Gmail
          </a>
        </div>
        <button
          onClick={() => setSubmitState('idle')}
          className="font-body font-semibold px-8 py-3 rounded-full transition-colors"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          Make Another Booking
        </button>
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded-2xl border p-8"
      style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <h2 className="font-heading font-bold text-3xl mb-1" style={{ color: 'var(--color-primary)' }}>
        Book a Consultation
      </h2>
      <p className="font-body text-gray-500 text-sm mb-8">
        Fill in your details to save a consultation request, or use the direct WhatsApp and Gmail contact options for faster follow-up.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-body font-semibold text-sm text-gray-700 mb-2">First Name *</label>
            <input
              {...register('firstName')}
              type="text"
              placeholder="Ada"
              className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none"
              style={fieldStyle}
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1 font-body">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block font-body font-semibold text-sm text-gray-700 mb-2">Last Name *</label>
            <input
              {...register('lastName')}
              type="text"
              placeholder="Okonkwo"
              className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none"
              style={fieldStyle}
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1 font-body">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="block font-body font-semibold text-sm text-gray-700 mb-2">Email Address *</label>
          <input
            {...register('email')}
            type="email"
            placeholder="ada@example.com"
            className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none"
            style={fieldStyle}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1 font-body">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block font-body font-semibold text-sm text-gray-700 mb-2">Phone Number</label>
          <input
            {...register('phone')}
            type="tel"
            placeholder="08012345678"
            className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none"
            style={fieldStyle}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1 font-body">{errors.phone.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-body font-semibold text-sm text-gray-700 mb-2">Preferred Date</label>
            <input
              {...register('preferredDate')}
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none"
              style={fieldStyle}
            />
          </div>
          <div>
            <label className="block font-body font-semibold text-sm text-gray-700 mb-2">Preferred Time</label>
            <select
              {...register('preferredTime')}
              className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none"
              style={fieldStyle}
            >
              <option value="">Select a time…</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>{slot} WAT</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-body font-semibold text-sm text-gray-700 mb-2">
            Reason for Visit / Message *
          </label>
          <textarea
            {...register('message')}
            rows={4}
            placeholder="Briefly describe what you'd like to discuss or any specific concerns…"
            className="w-full px-4 py-3 rounded-xl border font-body text-sm focus:outline-none resize-none"
            style={fieldStyle}
          />
          {errors.message && <p className="text-red-500 text-xs mt-1 font-body">{errors.message.message}</p>}
        </div>

        {submitState === 'error' && (
          <div
            className="flex items-center gap-2 rounded-xl p-4 border"
            style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}
          >
            <AlertCircle size={18} style={{ color: '#dc2626' }} />
            <p className="font-body text-sm" style={{ color: '#b91c1c' }}>
              Something went wrong. Please try again or use WhatsApp or Gmail for direct contact.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitState === 'loading'}
          className="w-full font-body font-semibold py-4 rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          {submitState === 'loading' ? 'Sending…' : 'Send Booking Request'}
        </button>
      </form>
    </div>
  )
}
