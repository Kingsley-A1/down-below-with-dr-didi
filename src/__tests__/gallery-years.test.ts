import { describe, expect, it } from '@jest/globals'
import { getGalleryEventYearOptions, isValidGalleryEventYear } from '@/lib/gallery-years'

describe('gallery event years', () => {
  it('lists years newest first from the current year down to 2019', () => {
    const years = getGalleryEventYearOptions(new Date('2026-10-19'))
    expect(years[0]).toBe(2026)
    expect(years[years.length - 1]).toBe(2019)
    expect(years).toHaveLength(8)
  })

  it('adds 2027 once the clock reaches it', () => {
    expect(getGalleryEventYearOptions(new Date('2027-01-02'))[0]).toBe(2027)
  })

  it('rejects years outside the supported range', () => {
    const now = new Date('2026-10-19')
    expect(isValidGalleryEventYear(2018, now)).toBe(false)
    expect(isValidGalleryEventYear(2027, now)).toBe(false)
    expect(isValidGalleryEventYear(2022.5, now)).toBe(false)
    expect(isValidGalleryEventYear(2019, now)).toBe(true)
  })
})
