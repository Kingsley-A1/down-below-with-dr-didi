export interface GalleryItem {
  id: number
  title: string
  date: string
  location: string
  image: string
  description: string
}

export interface ImpactMetric {
  label: string
  value: string
  icon: string
}

export const impactMetrics: ImpactMetric[] = [
  { label: 'Years in Active Service', value: '2+', icon: '⏳' },
  { label: 'Women Reached', value: '5,000+', icon: '👩' },
  { label: 'Communities Served', value: '12', icon: '🏘️' },
  { label: 'Health Talks Hosted', value: '48', icon: '🎤' },
]

export const galleryItems: GalleryItem[] = [
  {
    id: 1,
    title: 'Community Support Distribution — Calabar South',
    date: 'March 2024',
    location: 'Calabar South, Cross River',
    image: '/assets/IMG-20260508-WA0084.jpg',
    description: 'A neighborhood support drive where the outreach team coordinated clothing distribution and health engagement for women and families.',
  },
  {
    id: 2,
    title: 'Community Support Drive — Main Collection Point',
    date: 'March 2024',
    location: 'Calabar South, Cross River',
    image: '/assets/IMG-20260508-WA0083.jpg',
    description: 'Volunteers and participants gathered at the central point for structured item distribution and reproductive health signposting.',
  },
  {
    id: 3,
    title: 'Direct Community Engagement in the Field',
    date: 'March 2024',
    location: 'Calabar South, Cross River',
    image: '/assets/dr_didi_hospital_bed_renewal_2.jpg',
    description: 'Dr. Didi and team members engaged women directly, combining practical support with trusted, faith-sensitive health guidance.',
  },
  {
    id: 4,
    title: 'Outreach Team Operations on Site',
    date: 'March 2024',
    location: 'Calabar South, Cross River',
    image: '/assets/IMG-20260508-WA0081.jpg',
    description: 'The field team organized logistics, sorted supplies, and coordinated beneficiaries to keep the outreach efficient and dignified.',
  },
  {
    id: 5,
    title: 'Community Gathering and Health Awareness Session',
    date: 'February 2024',
    location: 'Cross River State',
    image: '/assets/IMG-20260508-WA0079.jpg',
    description: 'A large community assembly where women and families received coordinated support and practical health awareness messaging.',
  },
  {
    id: 6,
    title: 'Founder-Led Public Health Mobilization',
    date: 'January 2024',
    location: 'Calabar, Cross River',
    image: '/assets/breast_cancer_outreach_dr_didi_speaking.jpg',
    description: 'Dr. Didi led a high-energy outreach moment focused on women\'s health education, trust building, and community mobilization.',
  },
]
