'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { siteSettingsSchema, type SiteSettingsFormData } from '@/lib/validations'
import { uploadAdminMediaAsset } from '@/components/admin/media-upload'

const fields: Array<{ name: keyof SiteSettingsFormData; label: string; multiline?: boolean }> = [
  { name: 'siteName', label: 'Site name' },
  { name: 'tagline', label: 'Tagline', multiline: true },
  { name: 'motto', label: 'Motto' },
  { name: 'siteUrl', label: 'Site URL' },
  { name: 'primaryWhatsapp', label: 'Primary WhatsApp URL' },
  { name: 'contactEmail', label: 'Public Gmail address' },
  { name: 'heroHeadline', label: 'Hero headline' },
  { name: 'heroBody', label: 'Hero supporting text', multiline: true },
  { name: 'heroImageAlt', label: 'Hero image alt text' },
  { name: 'footerBlurb', label: 'Footer blurb', multiline: true },
]

export default function SiteSettingsForm({ initialValues }: { initialValues: SiteSettingsFormData }) {
  const [serverMessage, setServerMessage] = useState('')
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null)
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: initialValues,
  })

  const currentHeroImageUrl = watch('heroImageUrl')

  async function onSubmit(values: SiteSettingsFormData) {
    setServerMessage('')

    let payload = values

    if (heroImageFile) {
      setUploadingHeroImage(true)

      try {
        const upload = await uploadAdminMediaAsset(
          heroImageFile,
          'Homepage hero image',
          values.heroImageAlt || values.heroHeadline
        )

        payload = {
          ...values,
          heroImageUrl: upload.url,
        }
      } catch (error) {
        setUploadingHeroImage(false)
        setServerMessage(error instanceof Error ? error.message : 'Unable to upload hero image')
        return
      }

      setUploadingHeroImage(false)
    }

    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
      <input type="hidden" {...register('heroImageUrl')} />

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

      <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--color-border)' }}>
        <label className="block font-body text-sm font-semibold mb-2" htmlFor="heroImageUpload">
          Hero image upload
        </label>
        <input
          id="heroImageUpload"
          type="file"
          accept="image/*"
          onChange={(event) => setHeroImageFile(event.target.files?.[0] ?? null)}
          className="w-full rounded-xl border px-4 py-3 font-body text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        />
        <p className="mt-2 font-body text-xs text-gray-500">
          {heroImageFile
            ? `Selected: ${heroImageFile.name}`
            : currentHeroImageUrl
              ? 'Current hero image is set. Upload a file only to replace it.'
              : 'No hero image is set yet. Upload from media pipeline.'}
        </p>
        {currentHeroImageUrl ? (
          <button
            type="button"
            onClick={() => {
              setValue('heroImageUrl', '', { shouldDirty: true })
              setHeroImageFile(null)
            }}
            className="mt-2 rounded-lg border px-3 py-1.5 font-body text-xs font-semibold"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            Clear hero image
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting || uploadingHeroImage}
          className="rounded-full px-6 py-3 font-body font-semibold"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          {uploadingHeroImage ? 'Uploading hero image...' : isSubmitting ? 'Saving...' : 'Save Settings'}
        </button>
        {serverMessage ? <p className="font-body text-sm text-gray-600">{serverMessage}</p> : null}
      </div>
    </form>
  )
}