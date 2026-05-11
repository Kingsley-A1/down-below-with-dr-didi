export interface TeamMember {
  id: number
  slug: string
  name: string
  role: string
  tier: 'founder' | 'leadership' | 'core'
  sortOrder: number
  credentials: string
  bio: string
  image: string
}

export const team: TeamMember[] = [
  {
    id: 1,
    slug: 'dr-edidiong-ekereuke',
    name: 'Dr. Edidiong Ekereuke',
    role: 'Founder &  Executive Director',
    tier: 'founder',
    sortOrder: 0,
    credentials: 'Senior Medical Official, UCTH',
    bio: 'Faith-based women\'s health advocate focused on infertility management, reproductive education, and practical support for women and families.',
    image: '/assets/dr_didi_2.jpg',
  },
  {
    id: 2,
    slug: 'ngozi-eze',
    name: 'Ngozi Eze',
    role: 'Community Health Officer',
    tier: 'core',
    sortOrder: 1,
    credentials: 'BSc Public Health',
    bio: 'Leads outreach programs in underserved communities across Cross River State. Champions maternal health initiatives at grassroots level.',
    image: '/assets/IMG-20260508-WA0084.jpg',
  },
  {
    id: 3,
    slug: 'amaka-obi',
    name: 'Amaka Obi',
    role: 'Health Communications Lead',
    tier: 'core',
    sortOrder: 2,
    credentials: 'BA Communications',
    bio: 'Social media strategy and health literacy content for young women. Bridges the gap between clinical knowledge and everyday language.',
    image: '/assets/IMG-20260508-WA0081.jpg',
  },
]
