'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, MapPin, Calendar, Tag } from 'lucide-react'
import type { PublicGalleryImage, GalleryImageCategory } from '@/lib/admin/repository'
import { formatDate } from '@/lib/utils'

const CATEGORY_BADGE: Record<GalleryImageCategory, { bg: string; text: string }> = {
  outreach: { bg: '#dcfce7', text: '#166534' },
  event: { bg: '#fce7f3', text: '#be185d' },
  team: { bg: '#dbeafe', text: '#1e40af' },
  community: { bg: '#fef9c3', text: '#854d0e' },
  facility: { bg: '#ede9fe', text: '#7c3aed' },
}

type ImageViewModalProps = {
  images: PublicGalleryImage[]
  initialImageSlug?: string
}

export default function ImageViewModal({ images, initialImageSlug }: ImageViewModalProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  function getFocusableElements(root: HTMLElement) {
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    )
  }

  useEffect(() => {
    if (!initialImageSlug || activeIndex !== null || images.length === 0) {
      return
    }

    const index = images.findIndex((image) => image.slug === initialImageSlug)
    if (index >= 0) {
      const timeoutId = window.setTimeout(() => setActiveIndex(index), 0)
      return () => window.clearTimeout(timeoutId)
    }
  }, [activeIndex, images, initialImageSlug])

  useEffect(() => {
    if (activeIndex === null) {
      return
    }

    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null)
        return
      }

      if (event.key === 'Tab' && modalRef.current) {
        const focusable = getFocusableElements(modalRef.current)
        if (focusable.length === 0) {
          return
        }

        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        const active = document.activeElement as HTMLElement | null

        if (event.shiftKey && active === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && active === last) {
          event.preventDefault()
          first.focus()
        }

        return
      }

      if (event.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev === null ? 0 : (prev + 1) % images.length))
        return
      }

      if (event.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? 0 : (prev - 1 + images.length) % images.length
        )
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      lastFocusedRef.current?.focus()
    }
  }, [activeIndex, images.length])

  useEffect(() => {
    if (activeIndex === null) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [activeIndex])

  const activeImage = useMemo(
    () => (activeIndex === null ? null : images[activeIndex] ?? null),
    [activeIndex, images]
  )

  const activePosition = useMemo(
    () => (activeIndex === null ? 0 : activeIndex + 1),
    [activeIndex]
  )

  function openAt(index: number) {
    setActiveIndex(index)
  }

  function close() {
    setActiveIndex(null)
  }

  function showNext() {
    setActiveIndex((prev) => (prev === null ? 0 : (prev + 1) % images.length))
  }

  function showPrevious() {
    setActiveIndex((prev) =>
      prev === null ? 0 : (prev - 1 + images.length) % images.length
    )
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) {
      return
    }

    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    touchStartX.current = null

    if (Math.abs(delta) < 45) {
      return
    }

    if (delta < 0) {
      showNext()
      return
    }

    showPrevious()
  }

  return (
    <>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {images.map((image, index) => {
          const badge = CATEGORY_BADGE[image.category]

          return (
            <button
              key={image.id}
              type="button"
              onClick={() => openAt(index)}
              className="admin-interactive group block w-full rounded-xl overflow-hidden shadow-sm break-inside-avoid relative text-left"
              style={{ borderRadius: 'var(--radius-md, 0.75rem)' }}
              aria-label={`Open image viewer for ${image.title}`}
            >
              <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
                <Image
                  src={image.imageUrl}
                  alt={image.imageAlt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div
                  className="absolute inset-x-0 bottom-0 p-3"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.24) 70%, transparent 100%)',
                  }}
                >
                  <span
                    className="inline-block text-xs font-body font-semibold px-2 py-0.5 rounded-full mb-1.5"
                    style={{ backgroundColor: badge.bg, color: badge.text }}
                  >
                    {image.category.charAt(0).toUpperCase() + image.category.slice(1)}
                  </span>
                  <p className="font-body font-semibold text-sm text-white line-clamp-2">{image.title}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {activeImage ? (
        <div className="fixed inset-0 z-70" role="dialog" aria-modal="true" aria-label="Image viewer">
          <button
            type="button"
            className="absolute inset-0 bg-black/85"
            aria-label="Close image viewer"
            onClick={close}
          />

          <div className="absolute inset-0 p-3 md:p-6 flex items-center justify-center">
            <div ref={modalRef} className="admin-dialog-enter relative w-full max-w-6xl max-h-full bg-black/20 rounded-2xl overflow-hidden border border-white/12">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                className="admin-interactive absolute top-3 right-3 z-20 rounded-full bg-black/55 text-white p-2 hover:bg-black/75"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <button
                type="button"
                onClick={showPrevious}
                className="admin-interactive absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/55 text-white p-2 hover:bg-black/75"
                aria-label="Previous image"
              >
                <ChevronLeft size={22} />
              </button>

              <button
                type="button"
                onClick={showNext}
                className="admin-interactive absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/55 text-white p-2 hover:bg-black/75"
                aria-label="Next image"
              >
                <ChevronRight size={22} />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
                <div
                  className="relative w-full bg-black/40"
                  style={{ minHeight: '56vh', maxHeight: '82vh' }}
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                >
                  <Image
                    src={activeImage.imageUrl}
                    alt={activeImage.imageAlt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 72vw"
                    priority
                  />
                </div>

                <div className="bg-white p-5 md:p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '82vh' }}>
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="inline-block text-xs font-body font-semibold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_BADGE[activeImage.category].bg,
                        color: CATEGORY_BADGE[activeImage.category].text,
                      }}
                    >
                      {activeImage.category.charAt(0).toUpperCase() + activeImage.category.slice(1)}
                    </span>
                    <span className="font-body text-xs text-gray-500">
                      {activePosition} / {images.length}
                    </span>
                  </div>

                  <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--color-text)' }}>
                    {activeImage.title}
                  </h2>

                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    {activeImage.description}
                  </p>

                  {(activeImage.eventName || activeImage.location || activeImage.capturedAt) ? (
                    <div className="space-y-2 pt-1">
                      {activeImage.eventName ? (
                        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                          <Tag className="w-4 h-4 shrink-0" />
                          <span className="font-body text-sm">{activeImage.eventName}</span>
                        </div>
                      ) : null}
                      {activeImage.location ? (
                        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="font-body text-sm">{activeImage.location}</span>
                        </div>
                      ) : null}
                      {activeImage.capturedAt ? (
                        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span className="font-body text-sm">{formatDate(activeImage.capturedAt)}</span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="font-body text-xs text-gray-500">
                    Swipe left or right on mobile, or use arrow keys to browse.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
