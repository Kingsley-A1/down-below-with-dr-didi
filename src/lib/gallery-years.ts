export const GALLERY_EVENT_YEAR_MIN = 2019

export function getGalleryEventYearMax(now: Date = new Date()): number {
  return now.getFullYear()
}

/** Newest first, from the current year down to 2019 (2027 appears once the clock reaches it). */
export function getGalleryEventYearOptions(now: Date = new Date()): number[] {
  const max = getGalleryEventYearMax(now)
  const years: number[] = []

  for (let year = max; year >= GALLERY_EVENT_YEAR_MIN; year -= 1) {
    years.push(year)
  }

  return years
}

export function isValidGalleryEventYear(year: number, now: Date = new Date()): boolean {
  return Number.isInteger(year) && year >= GALLERY_EVENT_YEAR_MIN && year <= getGalleryEventYearMax(now)
}
