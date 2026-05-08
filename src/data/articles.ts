export interface Article {
  slug: string
  title: string
  excerpt: string
  category: string
  coverImage: string
  author: string
  publishedAt: string
  readTime: number
  tags: string[]
}

export const articles: Article[] = [
  {
    slug: 'understanding-your-cycle',
    title: 'Understanding Your Menstrual Cycle',
    excerpt:
      'A plain-language guide to the four phases of your cycle — and what your body is doing at each stage.',
    category: 'menstrual',
    coverImage: '/assets/IMG-20260508-WA0032.jpg',
    author: 'Dr. Didi',
    publishedAt: '2024-03-15',
    readTime: 6,
    tags: ['menstrual health', 'cycle', 'hormones'],
  },
  {
    slug: 'menstrual-hygiene-guide',
    title: 'The Complete Menstrual Hygiene Guide',
    excerpt:
      'Everything you need to know about pads, tampons, menstrual cups, and keeping yourself healthy during your period.',
    category: 'menstrual',
    coverImage: '/assets/IMG-20260508-WA0033.jpg',
    author: 'Dr. Didi',
    publishedAt: '2024-02-20',
    readTime: 8,
    tags: ['menstrual hygiene', 'period products'],
  },
  {
    slug: 'sti-prevention-basics',
    title: 'STI Prevention: What Every Woman Should Know',
    excerpt:
      'Understanding sexually transmitted infections, how they spread, and the most effective prevention strategies.',
    category: 'sexual-wellness',
    coverImage: '/assets/IMG-20260508-WA0034.jpg',
    author: 'Dr. Didi',
    publishedAt: '2024-01-10',
    readTime: 7,
    tags: ['STI', 'sexual health', 'prevention'],
  },
  {
    slug: 'pap-smear-what-to-expect',
    title: 'Pap Smear: What to Expect and Why It Matters',
    excerpt:
      'A step-by-step explanation of the pap smear procedure — what happens, what it detects, and why every woman needs one.',
    category: 'preventative',
    coverImage: '/assets/IMG-20260508-WA0061.jpg',
    author: 'Dr. Didi',
    publishedAt: '2024-01-05',
    readTime: 5,
    tags: ['pap smear', 'cervical cancer', 'screening'],
  },
  {
    slug: 'female-anatomy-overview',
    title: 'Your Body, Explained: Female Reproductive Anatomy',
    excerpt:
      'A comprehensive overview of the female reproductive system — in plain language, no jargon.',
    category: 'anatomy',
    coverImage: '/assets/IMG-20260508-WA0068.jpg',
    author: 'Dr. Didi',
    publishedAt: '2023-12-01',
    readTime: 10,
    tags: ['anatomy', 'reproductive health', 'education'],
  },
  {
    slug: 'contraception-options',
    title: 'Contraception Options: A Complete Guide',
    excerpt:
      'Comparing all available contraception methods — effectiveness, side effects, and which might be right for you.',
    category: 'sexual-wellness',
    coverImage: '/assets/IMG-20260508-WA0073.jpg',
    author: 'Dr. Didi',
    publishedAt: '2023-11-15',
    readTime: 9,
    tags: ['contraception', 'family planning', 'sexual health'],
  },
]
