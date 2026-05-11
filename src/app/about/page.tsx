import type { Metadata } from 'next'
import Image from 'next/image'
import { Award, CheckCircle, GraduationCap, Sparkles, Target, Users } from 'lucide-react'
import { getPublishedTeamMembers, type PublicTeamMember } from '@/lib/admin/repository'
import { team as staticTeam } from '@/data/team'
import { canonicalUrl } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'About DownBelow',
  description:
    'Learn about DownBelow Family and Health Initiatives with Dr. Didi, a non-profit and non-denominational Christian ministry preserving the family unit through education, health guidance, and healing conversations.',
  alternates: {
    canonical: canonicalUrl('/about'),
  },
}

export default async function AboutPage() {
  let teamMembers: PublicTeamMember[]
  try {
    teamMembers = await getPublishedTeamMembers()
  } catch {
    teamMembers = []
  }

  if (teamMembers.length === 0) {
    teamMembers = staticTeam.map((m) => ({
      id: String(m.id),
      slug: m.slug ?? String(m.id),
      name: m.name,
      role: m.role,
      tier: (m.tier ?? 'core') as PublicTeamMember['tier'],
      sortOrder: m.sortOrder ?? 0,
      credentials: m.credentials ?? '',
      bio: m.bio,
      imageUrl: m.image ?? null,
      imageAlt: m.name,
    }))
  }

  const founder = teamMembers.find((member) => member.tier === 'founder')
  const leadership = teamMembers.filter((member) => member.tier === 'leadership')
  const core = teamMembers.filter((member) => member.tier === 'core')

  const rankedTeamMembers = [
    ...(founder ? [founder] : []),
    ...leadership,
    ...core,
  ]

  return (
    <>
      {/* Mission & Vision */}
      <section className="pt-32 pb-24 relative overflow-hidden" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="max-w-container mx-auto px-6 text-white text-center">
          <div
            className="inline-block text-sm font-body px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            Our Purpose
          </div>
          <h1 className="font-heading font-bold text-white mb-12" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>
            <span style={{ color: 'var(--color-accent)' }}>Mission</span> &amp; Vision
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="rounded-2xl p-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <Target size={28} className="mb-4" style={{ color: 'var(--color-accent)' }} />
              <h2 className="font-heading text-2xl font-semibold mb-3">Mission</h2>
              <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                Our mission is to provide accessible, reliable, and quality information on family,
                sexuality, and health, empowering individuals to make informed choices and take
                control of their lives.
              </p>
            </div>
            <div className="rounded-2xl p-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <Sparkles size={28} className="mb-4" style={{ color: 'var(--color-accent)' }} />
              <h2 className="font-heading text-2xl font-semibold mb-3">Vision</h2>
              <p className="font-body text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>
                To create a world where every individual and family has access to reliable
                information, supportive communities, and empowered choices for healthy living,
                loving relationships, and overall well-being.
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
                src="/assets/dr_didi_1.jpg"
                alt="Dr. Edidiong Ekereuke, founder of DownBelow Family and Health Initiatives with Dr. Didi"
                width={560}
                height={640}
                className="object-cover w-full"
                style={{ aspectRatio: '4 / 5', maxHeight: '500px' }}
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
                  DownBelow Family and Health Initiatives with Dr. Didi is a non-profit and
                  non-denominational Christian ministry made up of men and women from different
                  walks of life and denominations, with the primary objective of preserving the
                  family unit for God.
                </p>
                <p>
                  “Down below” speaks to hidden questions, difficult conversations, and cultural
                  myths people are often too afraid or shy to discuss openly. Our calling is to
                  bring those issues to light, expose in love, educate, and heal.
                </p>
                <p>
                  For over six years, this platform has provided practical support through daily
                  engagement, medical lectures, and faith-grounded discussions that strengthen
                  families and communities.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                  Qualifications &amp; Recognition
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Award, text: 'CAC Name: DOWNBELOW FAMILY HEALTH INITIATIVE WITH DR DIDI' },
                    { icon: GraduationCap, text: 'Senior Medical Official — University of Calabar Teaching Hospital (UCTH)' },
                    { icon: CheckCircle, text: 'Focus Areas: healthy relationships, family dynamics, sexuality, and health education' },
                    { icon: CheckCircle, text: 'Core Call: Expose love, educate, and heal' },
                    { icon: CheckCircle, text: 'Target Audience: individuals, couples, and families worldwide' },
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
            {rankedTeamMembers.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl p-8 border text-center transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
              >
                {member.imageUrl ? (
                  <Image
                    src={member.imageUrl}
                    alt={member.imageAlt ?? member.name}
                    width={96}
                    height={96}
                    className="rounded-full object-cover mx-auto mb-4"
                    style={{ width: '96px', height: '96px' }}
                  />
                ) : (
                  <div
                    className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--color-primary-muted)' }}
                    aria-label={`${member.name} profile image  placeholder`}
                  >
                    <Users size={34} style={{ color: 'var(--color-primary)' }} />
                  </div>
                )}
                <h3 className="font-heading font-bold text-xl mb-1" style={{ color: 'var(--color-primary)' }}>{member.name}</h3>
                <p className="font-body text-sm font-semibold mb-1" style={{ color: 'rgba(11,78,65,0.65)' }}>{member.role}</p>
                <p className="font-body text-xs text-gray-400 mb-4">{member.credentials}</p>
                <p className="font-body text-sm text-gray-600 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Objectives & Scope */}
      <section className="py-24" style={{ backgroundColor: 'var(--color-primary-muted)' }}>
        <div className="max-w-container mx-auto px-6">
          <div className="text-center mb-12">
            <div
              className="inline-block text-sm font-body font-semibold px-4 py-1.5 rounded-full mb-4 text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              What We Do
            </div>
            <h2 className="font-heading font-bold mb-4" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--color-primary)' }}>
              Expose Love, Educate, and Heal
            </h2>
            <p className="font-body text-gray-600 max-w-xl mx-auto text-sm leading-relaxed">
              We provide a safe, inclusive, and non-judgmental space where people can ask real
              questions, receive reliable guidance, and grow in healthy relationships and family life.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-heading text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                Objectives
              </h3>
              <ul className="space-y-3 font-body text-sm text-gray-700 leading-relaxed">
                <li>To educate and inform the public on healthy relationships, family dynamics, and reproductive health.</li>
                <li>To provide a platform for open discussions and awareness on sensitive topics.</li>
                <li>To promote holistic well-being, self-care, and mental health.</li>
                <li>To foster a supportive community encouraging healthy lifestyles and relationships.</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-heading text-xl font-semibold mb-4" style={{ color: 'var(--color-primary)' }}>
                Scope of Activities
              </h3>
              <ul className="space-y-3 font-body text-sm text-gray-700 leading-relaxed">
                <li>Social media engagement across Facebook, Instagram, TikTok, and YouTube.</li>
                <li>Online resources including blog posts, videos, and podcasts.</li>
                <li>Collaboration with healthcare professionals, educators, and experts.</li>
                <li>Community outreach programs, evangelical support, and medical events.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
