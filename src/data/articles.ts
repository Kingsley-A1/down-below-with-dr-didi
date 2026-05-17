export interface Article {
  slug: string
  title: string
  excerpt: string
  content: string[]
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
    content: [
      'Your menstrual cycle is a monthly hormonal process that prepares your body for possible pregnancy. Understanding it gives you power over your health, your fertility, and your wellbeing.',
      'The average cycle is 28 days, though anywhere from 21 to 35 days is considered normal. It has four distinct phases, each driven by different hormones.',
      'Menstruation begins the cycle. The uterine lining sheds because pregnancy did not occur, and oestrogen and progesterone are at their lowest.',
      'The follicular phase starts as follicle-stimulating hormone prompts the ovaries to develop follicles. Oestrogen rises and thickens the uterine lining.',
      'Ovulation happens when a surge in luteinising hormone releases a mature egg. This is your most fertile window, and the egg lives for about 12 to 24 hours.',
      'The luteal phase follows. Progesterone rises to maintain the uterine lining. If pregnancy does not occur, hormone levels fall and the cycle begins again.',
      'Stress, significant weight changes, illness, travel, and hormonal contraception can all shift cycle length. Tracking your cycle for three to six months gives you a personal baseline.',
      'Speak with a clinician if cycles are consistently under 21 days or over 35 days, bleeding is very heavy, or pain limits normal activity.',
    ],
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
    content: [
      'Good menstrual hygiene is essential for your health and comfort. Understanding your options lets you choose what fits your body, lifestyle, and budget.',
      'Disposable pads are widely used and should be changed every four to six hours to reduce odour and irritation. Choose absorbency based on your flow.',
      'Tampons absorb flow internally and should be changed every four to eight hours. Never leave a tampon in for more than eight hours.',
      'Menstrual cups are reusable silicone cups that can be worn for up to 12 hours. They are cost-effective over time but require proper cleaning and sterilisation.',
      'Reusable cloth pads and period underwear can be useful, but they must be washed thoroughly and dried completely before reuse.',
      'Always wash your hands before and after changing menstrual products. Do not flush pads, tampons, or wipes down the toilet.',
      'A mild smell during your period can be normal. A strong unpleasant odour, itching, pelvic pain, or unusual discharge should be checked by a clinician.',
    ],
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
    content: [
      'Sexually transmitted infections are more common than many people realise, and many are preventable or treatable when handled early.',
      'Common STIs include HIV, chlamydia, gonorrhoea, syphilis, herpes, HPV, and hepatitis B.',
      'STIs can spread through vaginal, anal, or oral sex. Some infections can also spread through skin-to-skin genital contact.',
      'Consistent and correct condom use reduces risk for many STIs. Vaccination also protects against HPV and hepatitis B.',
      'Regular testing matters because many STIs have no early symptoms. A person can feel well and still transmit an infection.',
      'If you think you may have an STI, avoid self-medication. See a qualified clinician for testing, treatment, and partner guidance.',
      'Having an STI is not a moral failure. Responsible testing and treatment protect you and the people connected to you.',
    ],
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
    content: [
      'A pap smear is a cervical screening test that detects abnormal cervical cells before they develop into cervical cancer.',
      'The test checks for cell changes in the cervix, including changes linked to human papillomavirus, which is a major cause of cervical cancer.',
      'Women aged 25 and above who are or have been sexually active should discuss screening with a clinician. Your doctor may recommend a different schedule based on your history.',
      'During the test, you lie on an examination table while a speculum is gently inserted so the cervix can be seen. A small brush collects cells from the cervix.',
      'The procedure usually takes only a few minutes. You may feel pressure or mild discomfort, but it should not be painful.',
      'Avoid scheduling during your period, and ask your clinician what to avoid before the test based on local protocol.',
      'Most results are normal. If abnormal cells are found, it does not automatically mean cancer. It means follow-up is needed.',
    ],
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
    content: [
      'Understanding your anatomy is a form of self-respect. Many women were never given accurate, judgment-free information about their bodies.',
      'The vulva is the external genital area. It includes the mons pubis, labia majora, labia minora, clitoris, vaginal opening, and urethral opening.',
      'The vagina and urethra are separate openings. The vagina connects to the cervix; the urethra is where urine exits.',
      'The vagina is a muscular, self-cleaning canal. Normal discharge helps maintain its balance and protection.',
      'The cervix is the lower part of the uterus. It produces mucus that changes through the menstrual cycle.',
      'The uterus is a muscular organ that sheds its lining during menstruation and can carry pregnancy.',
      'The fallopian tubes carry eggs from the ovaries toward the uterus, and fertilisation often happens there.',
      'The ovaries produce eggs and hormones including oestrogen and progesterone.',
    ],
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
    content: [
      'Choosing contraception is personal. The right option depends on your health, relationship, lifestyle, and future family plans.',
      'Condoms are barrier methods and are the only contraceptives that also reduce STI risk when used correctly.',
      'Hormonal options include pills, implants, injectables, and other clinician-prescribed methods. They work in different ways and may have side effects.',
      'Long-acting reversible contraceptives, such as implants and IUDs, are highly effective and useful for people who want reliable protection without daily action.',
      'Emergency contraception can reduce pregnancy risk after unprotected sex, but it should not replace a regular plan if ongoing contraception is needed.',
      'Fertility awareness requires careful tracking and regular cycles. It is less reliable for many people unless used with strong education and consistency.',
      'No method is perfect for everyone. Speak with a qualified clinician before choosing or changing contraception, especially if you have medical conditions.',
    ],
    category: 'sexual-wellness',
    coverImage: '/assets/IMG-20260508-WA0073.jpg',
    author: 'Dr. Didi',
    publishedAt: '2023-11-15',
    readTime: 9,
    tags: ['contraception', 'family planning', 'sexual health'],
  },
]
