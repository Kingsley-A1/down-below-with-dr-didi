export interface TeamMember {
  id: number
  name: string
  role: string
  credentials: string
  bio: string
  image: string
}

export const team: TeamMember[] = [
  {
    id: 1,
    name: 'Dr. Edidiong Ekereuke',
    role: 'Founder & Lead Physician',
    credentials: 'Senior Medical Official, UCTH',
    bio: 'Faith-based women\'s health advocate focused on infertility management, reproductive education, and practical support for women and families.',
    image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300',
  },
  {
    id: 2,
    name: 'Ngozi Eze',
    role: 'Community Health Officer',
    credentials: 'BSc Public Health',
    bio: 'Leads outreach programs in underserved communities across Cross River State. Champions maternal health initiatives at grassroots level.',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300',
  },
  {
    id: 3,
    name: 'Amaka Obi',
    role: 'Health Communications Lead',
    credentials: 'BA Communications',
    bio: 'Social media strategy and health literacy content for young women. Bridges the gap between clinical knowledge and everyday language.',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300',
  },
]
