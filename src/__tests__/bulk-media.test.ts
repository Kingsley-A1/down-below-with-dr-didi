import { describe, expect, it } from '@jest/globals'
import {
  filterBulkAdditions,
  isBulkDraftComplete,
  MAX_BULK_ITEMS,
  summarizeRejections,
} from '@/components/admin/bulk-media'

const MB = 1024 * 1024
const image = (name: string, size = MB) => ({ name, size, type: 'image/jpeg' })

describe('bulk media selection', () => {
  it('accepts up to 20 items and rejects the rest with a reason', () => {
    const files = Array.from({ length: 23 }, (_, index) => image(`photo-${index}.jpg`))
    const { accepted, rejected } = filterBulkAdditions(0, 0, files)

    expect(accepted).toHaveLength(MAX_BULK_ITEMS)
    expect(rejected).toHaveLength(3)
    expect(rejected[0].reason).toMatch(/20 items/)
  })

  it('counts items already chosen when adding more', () => {
    const { accepted } = filterBulkAdditions(18, 18 * MB, [image('a.jpg'), image('b.jpg'), image('c.jpg')])
    expect(accepted.map((file) => file.name)).toEqual(['a.jpg', 'b.jpg'])
  })

  it('rejects unsupported types and oversized files without blocking valid ones', () => {
    const { accepted, rejected } = filterBulkAdditions(0, 0, [
      { name: 'notes.pdf', size: MB, type: 'application/pdf' },
      image('huge.jpg', 11 * MB),
      { name: 'clip.mp4', size: 201 * MB, type: 'video/mp4' },
      { name: 'ok.mp4', size: 50 * MB, type: 'video/mp4' },
      image('ok.jpg'),
    ])

    expect(accepted.map((file) => file.name)).toEqual(['ok.mp4', 'ok.jpg'])
    expect(rejected.map((item) => item.name)).toEqual(['notes.pdf', 'huge.jpg', 'clip.mp4'])
  })

  it('enforces the total size cap', () => {
    const videos = Array.from({ length: 4 }, (_, index) => ({ name: `v${index}.mp4`, size: 150 * MB, type: 'video/mp4' }))
    const { accepted, rejected } = filterBulkAdditions(0, 0, videos)

    expect(accepted).toHaveLength(3)
    expect(rejected[0].reason).toMatch(/500 MB/)
  })

  it('treats a draft as complete only when title and description meet the gallery rules', () => {
    expect(isBulkDraftComplete({ title: 'Outreach day', description: 'Women gathered for a health talk.' })).toBe(true)
    expect(isBulkDraftComplete({ title: 'abc', description: 'Women gathered for a health talk.' })).toBe(false)
    expect(isBulkDraftComplete({ title: 'Outreach day', description: 'short' })).toBe(false)
  })

  it('summarizes rejections in one line', () => {
    expect(summarizeRejections([])).toBe('')
    expect(summarizeRejections([{ name: 'a.pdf', reason: 'Unsupported.' }, { name: 'b.pdf', reason: 'Unsupported.' }]))
      .toBe('a.pdf was skipped: Unsupported. (and 1 more skipped)')
  })
})
