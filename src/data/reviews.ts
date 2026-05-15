export interface ReviewSeedItem {
  displayName: string
  roleLabel?: string
  location?: string
  rating: number
  body: string
  adminReply?: string
  sortOrder: number
}

export const reviewSeedItems: ReviewSeedItem[] = [
  {
    displayName: 'Blessing Akpan',
    roleLabel: 'Community outreach participant',
    location: 'Calabar South',
    rating: 5,
    body:
      'Down Below made women in my community feel seen and respected. The team explained sensitive health topics clearly, gave practical support, and still treated every person with dignity.',
    adminReply:
      'Thank you, Blessing. This is exactly why we keep combining education, practical support, and compassionate presence in the field.',
    sortOrder: 0,
  },
  {
    displayName: 'Mary Udo',
    roleLabel: 'Event attendee',
    location: 'Cross River',
    rating: 5,
    body:
      'The session helped me ask questions I used to keep quiet about. I left with better understanding, confidence, and a clear next step for getting proper care.',
    adminReply:
      'We are grateful this helped you take the next step. Quiet questions deserve clear, safe answers.',
    sortOrder: 1,
  },
]
