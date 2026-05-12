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
    name: 'Dr. Mrs Edidiong Ekereuke',
    role: 'Founder & Executive Director',
    tier: 'founder',
    sortOrder: 0,
    credentials: 'Senior Medical Official, UCTH',
    bio: 'Faith-based women\'s health advocate focused on infertility management, reproductive education, and practical support for women and families.',
    image: '/assets/dr_didi_2.jpg',
  },
  {
    id: 2,
    slug: 'mrs-glory-victor-etienem',
    name: 'Mrs. Glory Victor Etienem',
    role: 'Head of Administration',
    tier: 'core',
    sortOrder: 1,
    credentials: '',
    bio: 'Head of Administration for Down Below Family Health Initiative.',
    image: '/assets/Mrs-Glory-Victor-Etienem-Head-of-Adminstration.jpg',
  },
  {
    id: 3,
    slug: 'mr-etoma-eugene',
    name: 'Mr. Etoma Eugene',
    role: 'General Secretary',
    tier: 'core',
    sortOrder: 3,
    credentials: '',
    bio: 'Secretary for Down Below Family Health Initiative.',
    image: '/assets/Mr-Etoma-Eugene-Secetrait.jpg',
  },
  {
    id: 5,
    slug: 'mrs-ebani-clarkson-agbor',
    name: 'Mrs. Ebani Clarkson Agbor',
    role: 'Financial Secretary',
    tier: 'core',
    sortOrder: 4,
    credentials: '',
    bio: 'Financial Secretary for Down Below Family Health Initiative.',
    image: '/assets/Mrs-Ebani-Carkson-Agbor-Financial-Secretary.jpg',
  },

      {
      id: 4,
      slug: 'mrs-gift-bunchi-abang',
      name: 'Mrs. Gift Bunchi Abang',
      role: 'Public Relations Officer',
      tier: 'core',
      sortOrder: 2,
      credentials: '',
      bio: 'Public Relations Officer for Down Below Family Health Initiative.',
      image: '/assets/Mrs-Gift-Bunchi-Abang-Public-Relation-Officer.jpg',
    }
]

