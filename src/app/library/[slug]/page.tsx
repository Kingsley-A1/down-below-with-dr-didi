import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import { articles } from '@/data/articles'
import { formatDate } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

const categoryLabels: Record<string, string> = {
  menstrual: 'Menstrual Health',
  'sexual-wellness': 'Sexual Wellness',
  preventative: 'Preventative Care',
  anatomy: 'Anatomy',
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  menstrual: { bg: '#fce7f3', text: '#be185d' },
  'sexual-wellness': { bg: '#ede9fe', text: '#7c3aed' },
  preventative: { bg: '#dcfce7', text: '#166534' },
  anatomy: { bg: '#dbeafe', text: '#1e40af' },
}

const articleContent: Record<string, string[]> = {
  'understanding-your-cycle': [
    'Your menstrual cycle is a monthly hormonal process that prepares your body for possible pregnancy. Understanding it gives you power over your health, your fertility, and your wellbeing.',
    'The average cycle is 28 days — though anywhere from 21 to 35 days is considered normal. It has four distinct phases, each driven by different hormones.',
    'Phase 1 — Menstruation (Days 1–5): Your period. The uterine lining sheds because pregnancy did not occur. Oestrogen and progesterone are at their lowest.',
    'Phase 2 — Follicular Phase (Days 1–13): Follicle-stimulating hormone (FSH) prompts the ovaries to develop follicles. Oestrogen rises, thickening the uterine lining.',
    'Phase 3 — Ovulation (Around Day 14): A surge in luteinising hormone (LH) triggers the release of a mature egg. This is your most fertile window — the egg lives for 12–24 hours.',
    'Phase 4 — Luteal Phase (Days 15–28): Progesterone rises to maintain the uterine lining. If pregnancy does not occur, hormone levels drop and the cycle begins again.',
    'What affects your cycle? Stress, significant weight changes, illness, travel, and hormonal contraception can all shift cycle length. Tracking your cycle for 3–6 months gives you a personal baseline.',
    'When to see a doctor: Cycles consistently under 21 or over 35 days, very heavy bleeding (soaking a pad every hour for multiple hours), or severe pain that limits daily activity all warrant medical review.',
  ],
  'menstrual-hygiene-guide': [
    'Good menstrual hygiene is essential for your health and comfort. With so many products available, understanding your options lets you make the best choice for your body, lifestyle, and budget.',
    'Disposable Pads: The most widely used option in Nigeria. Change every 4–6 hours to prevent odour and infection. Choose the absorbency level that matches your flow.',
    'Tampons: Inserted into the vagina to absorb flow internally. Safe for all ages. Change every 4–8 hours. Never leave in for more than 8 hours to prevent Toxic Shock Syndrome (TSS).',
    'Menstrual Cups: A reusable silicone cup inserted vaginally. Can be worn for up to 12 hours. More sustainable and cost-effective long-term. Requires sterilisation between cycles.',
    'Reusable Cloth Pads: Washable cotton pads. Eco-friendly and gentle on skin. Wash thoroughly with soap and hot water after each use.',
    'Period Underwear: Absorbent underwear worn without other products. Particularly useful for light days or as backup.',
    'Hygiene tips: Change products regularly. Wash your hands before and after changing. Never flush products down the toilet. Shower or wash daily during your period. Avoid douching — your vagina is self-cleaning.',
    'A note on odour: A mild smell during your period is completely normal. Strong, unpleasant odour can indicate bacterial vaginosis or an infection — see your doctor.',
  ],
  'sti-prevention-basics': [
    'Sexually transmitted infections (STIs) are more common than many people realise — and more preventable. Knowledge is your best protection.',
    'Common STIs in Nigeria include: HIV/AIDS, chlamydia, gonorrhoea, syphilis, herpes (HSV-1 and HSV-2), HPV (human papillomavirus), and hepatitis B.',
    'How STIs spread: Through vaginal, anal, or oral sex. Some (like herpes and HPV) also spread through skin-to-skin genital contact. HIV can spread through shared needles.',
    'Prevention Strategies: Consistent, correct condom use reduces the risk of most STIs significantly. Get vaccinated — vaccines exist for HPV and Hepatitis B. Limit number of partners. Get regular STI testing if sexually active.',
    'Important: Having an STI does not make you a "bad" person. Many STIs have no symptoms, so people transmit them without knowing. Regular testing is responsible self-care.',
    'Testing: Many STIs are treatable — but you need to know you have one first. If you are sexually active, discuss testing with your doctor. Many clinics in Cross River State offer confidential testing.',
    'If you think you have an STI: Do not self-medicate. See a doctor for proper diagnosis. Inform recent partners so they can also get tested. Complete the full course of any prescribed treatment.',
  ],
  'pap-smear-what-to-expect': [
    'A pap smear (or cervical smear test) is one of the most important health checks a woman can have. It detects abnormal cervical cells before they develop into cervical cancer — making it a life-saving procedure.',
    'What it checks for: Abnormal cell changes in the cervix, including those caused by human papillomavirus (HPV), which is the most common cause of cervical cancer.',
    'Who should have one? All women aged 25 and above who are or have been sexually active. If you have had abnormal results previously, your doctor may recommend more frequent testing.',
    'How often? Every 3–5 years if results are normal. More frequently if results show abnormalities or if you are immunocompromised.',
    'What happens during the procedure? You lie on an examination table with your knees bent. Your doctor gently inserts a speculum into the vagina to view the cervix. A small brush collects cells from the cervix. The sample is sent to a laboratory. The whole procedure takes less than 5 minutes.',
    'Does it hurt? You may feel some pressure or mild discomfort — similar to period cramps. It should not be painful. If it is, tell your doctor immediately.',
    'Before your test: Avoid scheduling during your period. Do not use vaginal creams, sprays, or have sex for 24 hours before. An empty bladder makes the procedure more comfortable.',
    'After your test: Light spotting for a day or two is normal. Results typically take 2–4 weeks. Most results are normal. If abnormal cells are found, further tests will be arranged — this does not mean you have cancer.',
  ],
  'female-anatomy-overview': [
    'Understanding your own anatomy is a form of self-respect. Many women have never been given accurate, judgment-free information about their reproductive organs. This article changes that.',
    'External Anatomy (the Vulva): The vulva is everything you can see externally. It includes: the mons pubis (fatty tissue over the pubic bone), the labia majora and minora (outer and inner folds of skin), the clitoris (a highly sensitive organ with an internal structure much larger than the visible tip), the vaginal opening, and the urethral opening (where urine exits).',
    'Important: The vagina and the urethra are separate openings. Many women are taught this incorrectly.',
    'The Vagina: A muscular, self-cleaning canal approximately 7–10 cm long that connects the vulva to the cervix. It expands during arousal and childbirth. Healthy vaginal discharge helps maintain its pH balance.',
    'The Cervix: The lower, narrow part of the uterus that connects to the vagina. It produces mucus that changes consistency throughout your cycle.',
    'The Uterus (Womb): A pear-shaped muscular organ that grows and sheds its lining each month (menstruation) and houses a foetus during pregnancy.',
    'The Fallopian Tubes: Two tubes that carry eggs from the ovaries to the uterus. Fertilisation typically occurs in the fallopian tube.',
    'The Ovaries: Two almond-sized organs that produce eggs and the hormones oestrogen and progesterone. You are born with all your eggs — approximately 1–2 million — and release about 400–500 over your reproductive lifetime.',
  ],
  'contraception-options': [
    'Choosing contraception is a personal decision that depends on your health, lifestyle, relationship, and future family plans. There is no single "best" method — the best method is the one you will use consistently.',
    'Barrier Methods: Condoms (male and female) — the only contraceptives that also protect against STIs. 85–98% effective. The female condom (internal condom) gives women control and is highly effective.',
    'Hormonal Methods: The combined pill (oestrogen + progestogen) — 91–99% effective when taken correctly. Take at the same time daily. The progestogen-only pill (mini-pill) — suitable for women who cannot take oestrogen, including breastfeeding mothers. The hormonal implant — a small rod inserted under the skin of the upper arm, lasts 3–5 years, 99% effective.',
    'Long-Acting Reversible Contraceptives (LARCs): The copper IUD — hormone-free, lasts up to 10–12 years, 99% effective. Can also be used as emergency contraception within 5 days of unprotected sex. The injectable (Depo-Provera) — given every 12 weeks, 94–99% effective.',
    'Emergency Contraception: "Morning-after" pill — effective up to 72 hours after unprotected sex (some types up to 120 hours). NOT an abortion pill. The copper IUD — most effective form of emergency contraception (over 99%).',
    'Fertility Awareness Methods: Tracking your cycle to avoid sex during fertile windows. Requires careful monitoring and regular cycles. Less effective than other methods (76–88% with typical use).',
    'Permanent Methods: Tubal ligation (female sterilisation) and vasectomy (male sterilisation) — considered permanent. Only appropriate if you are certain you do not want future pregnancies.',
    'Key message: All contraceptives except condoms do NOT protect against STIs. If STI protection is needed, always use condoms — even alongside other contraceptive methods.',
  ],
}

export async function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = articles.find((a) => a.slug === slug)
  if (!article) return { title: 'Article Not Found' }
  return { title: article.title, description: article.excerpt }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = articles.find((a) => a.slug === slug)
  if (!article) notFound()

  const content = articleContent[slug] || [article.excerpt]
  const related = articles.filter((a) => a.category === article.category && a.slug !== slug).slice(0, 3)
  const col = categoryColors[article.category] || { bg: '#f3f4f6', text: '#374151' }

  return (
    <>
      <div className="pt-32 pb-12" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 font-body text-sm mb-6 transition-colors"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            <ArrowLeft size={16} /> Back to Library
          </Link>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span
              className="text-xs font-body font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: col.bg, color: col.text }}
            >
              {categoryLabels[article.category]}
            </span>
            <span className="flex items-center gap-1 font-body text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <Clock size={12} /> {article.readTime} min read
            </span>
            <span className="flex items-center gap-1 font-body text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <Calendar size={12} /> {formatDate(article.publishedAt)}
            </span>
          </div>
          <h1
            className="font-heading font-bold text-white mb-4"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
          >
            {article.title}
          </h1>
          <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
            By Dr. Didi · MBBCH, MPH
          </p>
        </div>
      </div>

      <div className="max-w-container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl overflow-hidden mb-10 shadow-lg">
            <Image
              src={article.coverImage}
              alt={article.title}
              width={960}
              height={440}
              className="object-cover w-full"
              style={{ height: '320px' }}
              priority
            />
          </div>

          <article>
            {content.map((paragraph, i) => (
              <p key={i} className="font-body text-gray-700 leading-relaxed mb-5 text-base">
                {paragraph}
              </p>
            ))}
          </article>

          <div
            className="mt-10 rounded-xl p-5 border"
            style={{ backgroundColor: '#fffbeb', borderColor: '#fcd34d' }}
          >
            <p className="font-body text-sm" style={{ color: '#92400e' }}>
              ⚕️{' '}
              <strong>Medical Disclaimer:</strong> This article is for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="py-16 border-t" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="max-w-container mx-auto px-6">
            <h2 className="font-heading font-bold text-3xl mb-8" style={{ color: 'var(--color-primary)' }}>
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rel) => (
                <Link key={rel.slug} href={`/library/${rel.slug}`} className="group">
                  <div
                    className="bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="relative overflow-hidden" style={{ height: '160px' }}>
                      <Image
                        src={rel.coverImage}
                        alt={rel.title}
                        width={300}
                        height={160}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3
                        className="font-heading font-semibold text-lg transition-colors"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {rel.title}
                      </h3>
                      <p className="font-body text-xs text-gray-400 mt-1">{rel.readTime} min read</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
