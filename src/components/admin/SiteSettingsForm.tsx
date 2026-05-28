'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
import { siteSettingsSchema, type SiteSettingsFormData } from '@/lib/validations'
import { uploadAdminMediaAsset } from '@/components/admin/media-upload'
import { parseApiError, readJsonResponse } from '@/lib/api/client-error'

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
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: initialValues,
  })

  const currentHeroImageUrl = useWatch({ control, name: 'heroImageUrl' })
  const currentHeroImageAlt = useWatch({ control, name: 'heroImageAlt' })
  const currentHeroHeadline = useWatch({ control, name: 'heroHeadline' })
  const heroPreviewUrl = useMemo(() => {
    if (heroImageFile) {
      return URL.createObjectURL(heroImageFile)
    }

    return currentHeroImageUrl || ''
  }, [currentHeroImageUrl, heroImageFile])

  useEffect(() => {
    return () => {
      if (heroImageFile && heroPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(heroPreviewUrl)
      }
    }
  }, [heroImageFile, heroPreviewUrl])

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

    const result = await readJsonResponse(response)

    if (!response.ok) {
      const parsed = parseApiError(result, 'Unable to save settings')
      for (const [field, messages] of Object.entries(parsed.fieldErrors)) {
        const message = messages[0]
        if (message && field !== 'form') {
          setError(field as keyof SiteSettingsFormData, { message })
        }
      }
      setServerMessage(parsed.message)
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
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
          <Camera className="h-3.5 w-3.5" />
          <span>Camera</span>
        </div>
        <input
          id="heroImageUpload"
          type="file"
          accept="image/*"
          onChange={(event) => setHeroImageFile(event.target.files?.[0] ?? null)}
          className="w-full rounded-xl border px-4 py-3 font-body text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        />
        {heroPreviewUrl ? (
          <div className="mt-3 inline-flex max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroPreviewUrl} alt={currentHeroImageAlt || currentHeroHeadline || 'Hero image preview'} className="max-h-72 max-w-full rounded-lg object-contain" />
          </div>
        ) : null}
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
