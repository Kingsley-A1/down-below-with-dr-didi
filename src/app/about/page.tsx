import type { Metadata } from 'next'
import Image from 'next/image'
import { GraduationCap, Award, CheckCircle } from 'lucide-react'
import { team } from '@/data/team'

export const metadata: Metadata = {
  title: 'About Dr. Didi',
  description:
    "Learn about Dr. Edidiong Ekereuke, founder of Down Below With Dr. Didi, and the initiative's faith-based mission for women's reproductive health.",
}

const partners = [
  { name: 'Pink Africa Foundation', type: 'Health Foundation' },
  { name: 'Asi Ukpo Hospitals', type: 'Hospital Partner' },
  { name: 'University of Calabar Teaching Hospital (UCTH)', type: 'Clinical Institution' },
  { name: 'Community Faith Leaders', type: 'Community Partner' },
  { name: 'Local Women Support Groups', type: 'Grassroots Network' },
  { name: 'Regional Screening Volunteers', type: 'Medical Volunteers' },
]

export default function AboutPage() {
  return (
    <>
      {/* Mission & Vision */}
      <section className="pt-32 pb-24 relative overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="absolute right-0 top-0 text-[200px] leading-none select-none pointer-events-none" style={{ opacity: 0.07 }}>
          🌻
        </div>
        <div className="max-w-container mx-auto px-6 text-white text-center">
          <div
            className="inline-block text-sm font-body px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            Our Purpose
          </div>
          <h1 className="font-heading font-bold text-white mb-12" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
            Mission &amp; Vision
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="rounded-2xl p-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="text-2xl mb-3">🎯</div>
              <h2 className="font-heading text-2xl font-semibold mb-3">Mission</h2>
              <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                To teach, heal, and uplift women and families through evidence-based medical guidance, natural wellness support, and prayer-centered community care.
              </p>
            </div>
            <div className="rounded-2xl p-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div className="text-2xl mb-3">🌟</div>
              <h2 className="font-heading text-2xl font-semibold mb-3">Vision</h2>
              <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                A global family of women who can access trusted reproductive health support while growing in purpose, wholeness, and faith.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dr. Didi Bio */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-16 items-start">
            <div className="rounded-2xl overflow-hidden sticky top-24 shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=700"
                alt="Dr. Didi — Founder"
                width={560}
                height={640}
                className="object-cover w-full"
                style={{ height: '500px' }}
              />
            </div>
            <div>
              <div
                className="inline-block text-sm font-body font-semibold px-4 py-1.5 rounded-full mb-6"
                style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
              >
                Meet the Founder
              </div>
              <h2 className="font-heading font-bold mb-1" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-primary)' }}>
                Dr. Didi
              </h2>
              <p className="font-body text-gray-500 mb-6">Dr. Edidiong Ekereuke · Senior Medical Official (UCTH)</p>

              <div className="space-y-4 font-body text-gray-700 leading-relaxed mb-8 text-sm">
                <p>
                  Dr. Edidiong Ekereuke (Dr. Didi) is a Senior Medical Official at the University of Calabar Teaching Hospital (UCTH), with a longstanding commitment to women&apos;s reproductive health and infertility support.
                </p>
                <p>
                  Through Down Below With Dr. Didi, she leads a faith-based family health movement that combines clinical consultations with natural health strategies, prayer, and practical education women can use daily.
                </p>
                <p>
                  Since launch, the initiative has passed two years of active service, reaching women through community outreaches in Calabar and through digital channels that serve a global audience.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                  Qualifications &amp; Recognition
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: GraduationCap, text: 'Senior Medical Official — University of Calabar Teaching Hospital (UCTH)' },
                    { icon: CheckCircle, text: 'Clinical focus on women\'s health and infertility management' },
                    { icon: CheckCircle, text: 'Community health educator for reproductive wellness and prevention' },
                    { icon: Award, text: 'Founder — Down Below With Dr. Didi Family Health Initiative' },
                    { icon: CheckCircle, text: 'Leads faith-integrated wellness programs and annual family retreat' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <Icon size={17} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <span className="font-body text-sm text-gray-700">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-white">
        <div className="max-w-container mx-auto px-6">
          <div className="text-center mb-12">
            <div
              className="inline-block text-sm font-body font-semibold px-4 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
            >
              The Team
            </div>
            <h2 className="font-heading font-bold" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--color-primary)' }}>
              The People Behind the Mission
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl p-8 border text-center transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
              >
                <Image
                  src={member.image}
                  alt={member.name}
                  width={96}
                  height={96}
                  className="rounded-full object-cover mx-auto mb-4"
                  style={{ width: '96px', height: '96px' }}
                />
                <h3 className="font-heading font-bold text-xl mb-1" style={{ color: 'var(--color-primary)' }}>{member.name}</h3>
                <p className="font-body text-sm font-semibold mb-1" style={{ color: 'rgba(11,78,65,0.65)' }}>{member.role}</p>
                <p className="font-body text-xs text-gray-400 mb-4">{member.credentials}</p>
                <p className="font-body text-sm text-gray-600 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-primary-muted)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="text-center mb-12">
            <div
              className="inline-block text-sm font-body font-semibold px-4 py-1.5 rounded-full mb-4 text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Partners &amp; Collaborations
            </div>
            <h2 className="font-heading font-bold mb-4" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--color-primary)' }}>
              Working Together for Women&apos;s Health
            </h2>
            <p className="font-body text-gray-600 max-w-xl mx-auto text-sm leading-relaxed">
              We collaborate with leading health organisations, government bodies, and NGOs to extend our reach and impact.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 border text-center transition-colors hover:border-primary"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{ backgroundColor: 'var(--color-primary-muted)' }}
                >
                  🤝
                </div>
                <p className="font-body text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {partner.name}
                </p>
                <p className="font-body text-xs text-gray-400">{partner.type}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
