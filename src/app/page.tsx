import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, Users, Heart, Shield, ChevronRight } from 'lucide-react'
import { articles } from '@/data/articles'
import { vaultPreviewItems } from '@/data/vault-preview'
import { formatDate } from '@/lib/utils'

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

export default function HomePage() {
  const latestArticles = [...articles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3)

  const quickStats = [
    { label: 'Women reached across communities', value: '5,000+' },
    { label: 'Communities in Cross River served', value: '12' },
    { label: 'Health talks and outreaches hosted', value: '48' },
  ]

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[88vh] lg:min-h-screen flex items-center overflow-hidden"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {/* subtle noise texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.012,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="max-w-container mx-auto px-5 sm:px-6 pt-28 pb-16 sm:pt-32 sm:pb-20 grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 lg:gap-12 items-center w-full">
          {/* Left */}
          <div style={{ color: '#fff' }}>
            <div
              className="inline-flex items-center gap-2 text-sm font-body px-4 py-2 rounded-full mb-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
            >
              Safe Space &middot; Judgment Free &middot; Evidence Based
            </div>

            <h1 className="font-heading font-bold leading-tight mb-6" style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)' }}>
              Teach. Heal. Win.<br />
              <span style={{ color: 'var(--color-accent)' }}>For God, Family,</span>{' '}
              and Women&apos;s Health
            </h1>

            <p className="font-body text-lg leading-relaxed mb-10 max-w-lg" style={{ color: 'rgba(255,255,255,0.78)' }}>
              A faith-based family health initiative blending clinical care, natural wellness guidance, and spiritual support for women across Nigeria and beyond.
            </p>

            <p className="font-body text-sm mb-8 max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Motto: Together we will teach, heal, and win the world for God.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/library"
                className="inline-flex items-center justify-center gap-2 font-body font-semibold px-8 py-4 rounded-full transition-all"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
              >
                <BookOpen size={18} />
                Explore the Library
              </Link>
              <Link
                href="/vault"
                className="inline-flex items-center justify-center gap-2 font-body font-semibold px-8 py-4 rounded-full border-2 transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}
              >
                <Shield size={18} />
                Ask Anonymously
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl px-4 py-3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                >
                  <p className="font-heading font-bold text-2xl" style={{ color: 'var(--color-accent)' }}>
                    {stat.value}
                  </p>
                  <p className="font-body text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.74)' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="relative order-first lg:order-none">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/30" style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}>
              <Image
                src="/down below with dr didi_2.jpeg"
                alt="Down Below with Dr. Didi outreach campaign banner"
                width={318}
                height={159}
                className="object-contain w-full lg:hidden"
                style={{ height: 'clamp(220px, 48vw, 360px)' }}
                priority
                quality={100}
                sizes="(max-width: 1024px) 92vw, 0px"
              />
              <Image
                src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcTcxrEC41nwlaFyJtTtKHgJ6gErW5c9yHK-I0BRZTcKw2UYQOyE"
                alt="Down Below with Dr. Didi outreach campaign banner"
                width={1200}
                height={675}
                className="hidden lg:block object-contain w-full"
                style={{ height: 'clamp(280px, 54vw, 430px)' }}
                quality={100}
                sizes="(min-width: 1024px) 42vw, 0px"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(11,78,65,0.14), rgba(11,78,65,0.02))' }}
              />
            </div>

            {/* Floating badge */}
            <div
              className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary-muted)' }}
              >
                <Shield size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <p className="font-body font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Safe Space</p>
                <p className="font-body text-xs text-gray-500">Faith + Medicine + Community</p>
              </div>
            </div>
          </div>
        </div>

        {/* scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span className="font-body text-xs">Scroll</span>
          <div className="w-px h-8" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </div>
      </section>

      {/* ─── Three Pillars ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="inline-block text-sm font-body font-semibold px-4 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
            >
              What We Do
            </div>
            <h2 className="font-heading font-bold mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-primary)' }}>
              Our Three Pillars
            </h2>
            <p className="font-body text-gray-600 max-w-xl mx-auto leading-relaxed">
              Every aspect of Down Below With Dr. Didi is built around three core principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Education',
                description: 'The Woman\'s Health Hub with practical SRH education, fertility awareness, and natural remedy guidance in clear language.',
                link: '/library',
                linkLabel: 'Explore Library',
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Outreaches, screenings, and the Down Below Family where women find support, prayer, and practical next steps.',
                link: '/outreach',
                linkLabel: 'See Our Impact',
              },
              {
                icon: Heart,
                title: 'Care',
                description: 'Infertility-focused consultations, reproductive health guidance, and compassionate care backed by clinical expertise.',
                link: '/contact',
                linkLabel: 'Book a Session',
              },
            ].map(({ icon: Icon, title, description, link, linkLabel }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 group"
                style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors group-hover:bg-primary"
                  style={{ backgroundColor: 'var(--color-primary-muted)' }}
                >
                  <Icon size={26} style={{ color: 'var(--color-primary)' }} className="group-hover:!text-white transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-2xl mb-3" style={{ color: 'var(--color-primary)' }}>{title}</h3>
                <p className="font-body text-gray-600 leading-relaxed mb-6 text-sm">{description}</p>
                <Link
                  href={link}
                  className="inline-flex items-center gap-1 font-body font-semibold text-sm transition-all hover:gap-2"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {linkLabel} <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── V-Vault Preview ───────────────────────────────────────────────── */}
      <section className="py-20 md:py-24" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="text-center mb-12">
            <div
              className="inline-block text-sm font-body px-4 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
            >
              The V-Vault
            </div>
            <h2 className="font-heading font-bold text-white mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Real Questions. Real Answers.
            </h2>
            <p className="font-body" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Submitted anonymously. Answered with care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {vaultPreviewItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-6">
                <div
                  className="text-xs font-body font-semibold px-3 py-1 rounded-full inline-block mb-4"
                  style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
                >
                  {item.category}
                </div>
                <p className="font-body text-gray-700 text-sm italic leading-relaxed mb-3">
                  &ldquo;{item.question}&rdquo;
                </p>
                <p className="font-body text-gray-500 text-xs leading-relaxed line-clamp-3">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
            >
              <Shield size={18} />
              Ask Your Own Question
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Welcome from Dr. Didi ─────────────────────────────────────────── */}
      <section className="py-20 md:py-24" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700"
                  alt="Dr. Didi — Founder"
                  width={500}
                  height={600}
                  className="object-cover w-full"
                  style={{ height: '480px' }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(11,78,65,0.3), transparent)' }}
                />
              </div>
              {/* stat badge */}
              <div
                className="absolute -bottom-5 -right-5 rounded-2xl p-5 shadow-xl"
                style={{ backgroundColor: 'var(--color-accent)', boxShadow: 'var(--shadow-lg)' }}
              >
                <p className="font-heading font-bold text-xl" style={{ color: 'var(--color-primary)' }}>5,000+</p>
                <p className="font-body text-xs" style={{ color: 'rgba(11,78,65,0.7)' }}>Women Reached</p>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div
                className="inline-block text-sm font-body font-semibold px-4 py-1.5 rounded-full mb-6"
                style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
              >
                A Message from Dr. Didi
              </div>
              <blockquote
                className="font-heading font-semibold italic leading-snug mb-6"
                style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: 'var(--color-primary)' }}
              >
                &ldquo;Your body deserves honesty. I created this space so you never have to feel embarrassed asking questions about your own health.&rdquo;
              </blockquote>
              <p className="font-signature text-2xl mb-1" style={{ color: 'var(--color-primary)' }}>
                — Dr. Didi, MBBS
              </p>
              <p className="font-body text-sm text-gray-500 mb-8">
                Founder, Down Below With Dr. Didi &middot; Calabar, Nigeria
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-full transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                Meet Dr. Didi <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Latest Resources ──────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-container mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <div>
              <div
                className="inline-block text-sm font-body font-semibold px-4 py-1.5 rounded-full mb-3"
                style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
              >
                Latest
              </div>
              <h2 className="font-heading font-bold" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--color-primary)' }}>
                From the Health Library
              </h2>
            </div>
            <Link
              href="/library"
              className="inline-flex items-center gap-1 font-body font-semibold text-sm transition-all hover:gap-2"
              style={{ color: 'var(--color-primary)' }}
            >
              View All Resources <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestArticles.map((article) => {
              const col = categoryColors[article.category] || { bg: '#f3f4f6', text: '#374151' }
              return (
                <Link key={article.slug} href={`/library/${article.slug}`} className="group">
                  <div
                    className="bg-white rounded-2xl overflow-hidden border h-full flex flex-col transition-all duration-300 hover:-translate-y-1"
                    style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    <div className="relative overflow-hidden" style={{ height: '210px' }}>
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        width={400}
                        height={210}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="text-xs font-body font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: col.bg, color: col.text }}
                        >
                          {categoryLabels[article.category]}
                        </span>
                        <span className="text-xs text-gray-400 font-body">{article.readTime} min read</span>
                      </div>
                      <h3 className="font-heading font-semibold text-xl mb-2 group-hover:text-primary-light transition-colors" style={{ color: 'var(--color-primary)' }}>
                        {article.title}
                      </h3>
                      <p className="font-body text-gray-600 text-sm leading-relaxed flex-1 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <span className="font-body text-xs text-gray-400">
                          Dr. Didi &middot; {formatDate(article.publishedAt)}
                        </span>
                        <ArrowRight size={15} style={{ color: 'var(--color-primary)' }} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA Strip ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-container mx-auto px-6 text-center">
          <h2 className="font-heading font-bold mb-4" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', color: 'var(--color-primary)' }}>
            Join the Down Below Family
          </h2>
          <p className="font-body text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with our Facebook community, watch in-depth tutorials on YouTube, and get updates on our annual family retreat.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="https://www.facebook.com/search/top?q=Down%20Below%20with%20Dr.%20Didi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 font-body font-semibold px-8 py-4 rounded-full border-2"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            >
              Join Facebook Community
            </Link>
            <Link
              href="https://www.youtube.com/results?search_query=Down+Below+with+Dr.+Didi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 font-body font-semibold px-8 py-4 rounded-full"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              Watch on YouTube
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA Strip ─────────────────────────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-accent)' }}>
        <div className="max-w-container mx-auto px-6 text-center">
          <h2 className="font-heading font-bold mb-4" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--color-primary)' }}>
            Ready to start your healing journey?
          </h2>
          <p className="font-body mb-8 max-w-lg mx-auto" style={{ color: 'rgba(11,78,65,0.7)' }}>
            Book a consultation, join a retreat update list, or explore trusted fertility and reproductive health resources.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            >
              Book a Consultation <ArrowRight size={16} />
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-full border-2 transition-all"
              style={{ borderColor: 'rgba(11,78,65,0.3)', color: 'var(--color-primary)' }}
            >
              Browse Free Resources
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
