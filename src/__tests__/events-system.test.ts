import { eventCommentSchema } from '@/lib/events/schemas'
import { detectStreamProvider, toEmbedUrl } from '@/lib/events/stream-utils'

describe('events system', () => {
  describe('eventCommentSchema', () => {
    it('strips html and trims comment body input', () => {
      const result = eventCommentSchema.parse({
        body: '  <script>alert("x")</script> Thank you for this session.  ',
      })

      expect(result.body).toBe('alert("x") Thank you for this session.')
    })

    it('rejects comments that are empty after sanitization', () => {
      const result = eventCommentSchema.safeParse({
        body: '<strong> </strong>',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('stream utils', () => {
    it('detects and converts YouTube watch URLs', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

      expect(detectStreamProvider(url)).toBe('youtube')
      expect(toEmbedUrl(url, 'youtube')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1')
    })

    it('encodes Facebook video URLs for plugin embeds', () => {
      const url = 'https://www.facebook.com/example/videos/123'

      expect(detectStreamProvider(url)).toBe('facebook')
      expect(toEmbedUrl(url, 'facebook')).toBe(
        'https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fexample%2Fvideos%2F123&show_text=0&width=auto'
      )
    })
  })
})
