'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { siteSettingsSchema, type SiteSettingsFormData } from '@/lib/validations'

const fields: Array<{ name: keyof SiteSettingsFormData; label: string; multiline?: boolean }> = [
  { name: 'siteName', label: 'Site name' },
  { name: 'tagline', label: 'Tagline', multiline: true },
  { name: 'motto', label: 'Motto' },
  { name: 'siteUrl', label: 'Site URL' },
  { name: 'primaryWhatsapp', label: 'Primary WhatsApp URL' },
  { name: 'contactEmail', label: 'Public Gmail address' },
  { name: 'heroHeadline', label: 'Hero headline' },
  { name: 'heroBody', label: 'Hero supporting text', multiline: true },
  { name: 'heroImageUrl', label: 'Hero image URL' },
  { name: 'heroImageAlt', label: 'Hero image alt text' },
  { name: 'footerBlurb', label: 'Footer blurb', multiline: true },
]

export default function SiteSettingsForm({ initialValues }: { initialValues: SiteSettingsFormData }) {
  const [serverMessage, setServerMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: initialValues,
  })

  async function onSubmit(values: SiteSettingsFormData) {
    setServerMessage('')

    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    const result = await response.json()

    if (!response.ok) {
      setServerMessage(result.error || 'Unable to save settings')
      return
    }

    setServerMessage('Settings saved successfully.')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {fields.map((field) => {
          const error = errors[field.name]

          return (
            <div key={field.name} className={field.multiline ? 'lg:col-span-2' : ''}>
              <label className="block font-body text-sm font-semibold mb-2" htmlFor={field.name}>
                {field.label}
              </label>
              {field.multiline ? (
                <textarea
                  id={field.name}
                  rows={4}
                  {...register(field.name)}
                  className="w-full rounded-2xl border px-4 py-3 font-body text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              ) : (
                <input
                  id={field.name}
                  {...register(field.name)}
                  className="w-full rounded-xl border px-4 py-3 font-body text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                />
              )}
              {error ? <p className="mt-2 text-sm text-red-600">{error.message}</p> : null}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full px-6 py-3 font-body font-semibold"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </button>
        {serverMessage ? <p className="font-body text-sm text-gray-600">{serverMessage}</p> : null}
      </div>
    </form>
  )
}