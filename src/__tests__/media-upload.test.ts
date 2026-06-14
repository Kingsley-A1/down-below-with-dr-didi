import { describe, expect, it } from '@jest/globals'
import { deriveMediaLabel } from '@/components/admin/media-upload'

describe('deriveMediaLabel', () => {
  it.each([
    ['outreach-launch.webp', 'outreach launch'],
    ['Dr_Didi--Clinic Photo.JPG', 'Dr Didi Clinic Photo'],
    ['family.health.image.png', 'family.health.image'],
    ['---.avif', 'Untitled image'],
  ])('derives an editable title from %s', (fileName, expected) => {
    expect(deriveMediaLabel(fileName)).toBe(expected)
  })
})
