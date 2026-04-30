import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { impactMetrics, galleryItems } from '@/data/outreach'

export const metadata: Metadata = {
  title: 'Community Outreach',
  description: "See the field impact of Down Below With Dr. Didi — from screenings and infertility education to faith-based family health programs.",
}

export default function OutreachPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 text-white text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6">
          <div
            className="inline-block text-sm font-body px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            Making a Difference
          </div>
          <h1 className="font-heading font-bold text-white mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)' }}>
            Community Outreach
          </h1>
          <p className="font-body text-lg max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Taking women&apos;s health education from screens to streets through screenings, consultations, and faith-rooted support.
          </p>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="py-14 border-t" style={{ backgroundColor: 'var(--color-primary)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {impactMetrics.map((metric) => (
              <div key={metric.label} className="text-center text-white">
                <div className="text-4xl mb-2">{metric.icon}</div>
                <div className="font-heading font-bold mb-1" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-accent)' }}>
                  {metric.value}
                </div>
                <div className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="text-center mb-12">
            <div
              className="inline-block text-sm font-body font-semibold px-4 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
            >
              Gallery
            </div>
            <h2 className="font-heading font-bold" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--color-primary)' }}>
              Our Work in the Community
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden cursor-pointer"
                style={{ boxShadow: 'var(--shadow-md)' }}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  width={600}
                  height={400}
                  className="object-cover w-full group-hover:scale-105 transition-transform duration-500"
                  style={{ height: '260px' }}
                />
                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(to top, rgba(11,78,65,0.92) 50%, rgba(11,78,65,0.15))' }}
                >
                  <p className="font-body text-xs font-semibold mb-1" style={{ color: 'var(--color-accent)' }}>
                    {item.date} &middot; {item.location}
                  </p>
                  <h3 className="font-heading font-bold text-white text-lg mb-1">{item.title}</h3>
                  <p className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {item.description}
                  </p>
                </div>
                {/* Always-visible mobile caption */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-4 lg:hidden"
                  style={{ background: 'linear-gradient(to top, rgba(11,78,65,0.8), transparent)' }}
                >
                  <h3 className="font-heading font-bold text-white text-base">{item.title}</h3>
                  <p className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="py-20" style={{ backgroundColor: 'var(--color-primary-muted)' }}>
        <div className="max-w-container mx-auto px-6 text-center">
          <h2 className="font-heading font-bold mb-4" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--color-primary)' }}>
            Want to Partner With Us?
          </h2>
          <p className="font-body text-gray-600 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
            We welcome collaborations with hospitals, foundations, churches, and community leaders to scale women&apos;s health and infertility support.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-full transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  )
}
