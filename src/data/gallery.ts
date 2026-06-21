export type GalleryCategory = 'outreach' | 'event' | 'team' | 'community' | 'facility'

export interface GallerySeedItem {
  slug: string
  title: string
  category: GalleryCategory
  imageUrl: string
  imageAlt: string
  description: string
}

export const gallerySeedItems: GallerySeedItem[] = [
  {
    slug: 'calabar-community-support-drive-2024',
    title: 'Community Support Distribution in Calabar South',
    category: 'outreach',
    imageUrl: '/assets/IMG-20260508-WA0084.jpg',
    imageAlt: 'Volunteers distributing support materials during a community outreach in Calabar South',
    description:
      'This outreach captured a structured distribution session where women and families received support materials in a respectful, community-first environment. Alongside distribution, the team shared practical reproductive health guidance and directed participants to follow-up channels for continued care.',
  },
  {
    slug: 'calabar-main-collection-point-2024',
    title: 'Main Collection Point Coordination and Beneficiary Support',
    category: 'community',
    imageUrl: '/assets/main-collection-point-coordination.jpg',
    imageAlt: 'Large crowd and volunteers coordinating distribution at a neighborhood collection point',
    description:
      'At the main collection point, the team coordinated beneficiary flow and item sorting to serve people safely and efficiently. The event combined practical aid delivery with confidence-building conversations about women\'s wellness and family health pathways.',
  },
  {
    slug: 'dr-didi-field-engagement-2024',
    title: 'Dr. Didi Field Engagement During Community Outreach',
    category: 'team',
    imageUrl: '/assets/dr_didi_hospital_bed_renewal_2.jpg',
    imageAlt: 'Dr. Didi standing with clinical partners during a hospital bed renewal outreach',
    description:
      'Dr. Didi is shown in active field engagement, supporting women directly during distribution and community interaction. The moment reflects the initiative\'s model of combining practical service, trust, and clear health communication at grassroots level.',
  },
  {
    slug: 'outreach-team-on-site-operations-2024',
    title: 'Outreach Team Operations and On-Site Coordination',
    category: 'outreach',
    imageUrl: '/assets/outreach-team-operations.jpg',
    imageAlt: 'Outreach volunteers in branded shirts organizing materials for distribution',
    description:
      'This image highlights the operational side of the outreach as volunteers coordinated inventory, sorting, and distribution sequencing. Strong on-site coordination helped maintain dignity for beneficiaries while keeping the event timely and inclusive.',
  },
  {
    slug: 'community-gathering-health-awareness-2024',
    title: 'Community Gathering for Health Awareness and Support',
    category: 'community',
    imageUrl: '/assets/community-gathering-awareness.jpg',
    imageAlt: 'Community members gathered under canopies during a support and awareness session',
    description:
      'A broad community gathering brought women, families, and local leaders together for coordinated support and health awareness. The session strengthened trust between the initiative and the community while reinforcing practical steps for reproductive wellness follow-up.',
  },
  {
    slug: 'founder-led-health-mobilization-calabar-2024',
    title: 'Founder-Led Breast Cancer Awareness Outreach in Calabar',
    category: 'event',
    imageUrl: '/assets/breast_cancer_outreach_dr_didi_speaking.jpg',
    imageAlt: 'Dr. Didi speaking with a microphone during a breast cancer awareness outreach',
    description:
      'Dr. Didi leads a public-facing awareness moment focused on education, early attention, and action for women\'s health. The event atmosphere captures the initiative\'s core approach: clinical clarity, compassionate communication, and strong community participation.',
  },
]
