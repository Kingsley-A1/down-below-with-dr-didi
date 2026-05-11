import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, Users } from 'lucide-react'
import { getPublishedTeamMembers, type PublicTeamMember } from '@/lib/admin/repository'
import { team as staticTeam } from '@/data/team'
import { canonicalUrl } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'The Amazing Hands Behind the Flame',
  description:
    'Meet Dr. Didi and the DownBelow Family team — clinicians, educators, and advocates serving individuals, couples, and families through holistic health support.',
  alternates: {
    canonical: canonicalUrl('/team'),
  },
}

export const dynamic = 'force-dynamic'

function toPublicTeamMember(m: (typeof staticTeam)[0]): PublicTeamMember {
  return {
    id: String(m.id),
    slug: m.slug,
    name: m.name,
    role: m.role,
    tier: m.tier,
    sortOrder: m.sortOrder,
    credentials: m.credentials,
    bio: m.bio,
    imageUrl: m.image,
    imageAlt: `${m.name}, ${m.role}`,
  }
}

export default async function TeamPage() {
  let members: PublicTeamMember[]

  try {
    members = await getPublishedTeamMembers()
  } catch {
    members = []
  }

  if (members.length === 0) {
    members = staticTeam.map(toPublicTeamMember)
  }

  const founder = members.find((m) => m.tier === 'founder')
  const leadership = members.filter((m) => m.tier === 'leadership')
  const core = members.filter((m) => m.tier === 'core')

  return (
    <>
      {/* Page Hero */}
      <section
        className="pt-32 pb-20 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <div
          className="absolute right-0 top-0 text-[200px] leading-none select-none pointer-events-none"
          style={{ opacity: 0.06 }}
        >
          🌿
        </div>
        <div className="max-w-container mx-auto px-6 text-white text-center">
          <div
            className="inline-block text-sm font-body px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          >
            The People Behind the Mission
          </div>
          <h1
            className="font-heading font-bold text-white mb-4"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)' }}
          >
            The Amazing Hands Behind the <span style={{ color: 'var(--color-accent)' }}>Flame</span>
          </h1>
          <p
            className="font-body text-base max-w-lg mx-auto"
            style={{ color: 'rgba(255,255,255,0.72)' }}
          >
            Clinicians and advocates serving individuals and families with compassion and integrity.
          </p>
        </div>
      </section>

      <main className="py-20" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-container mx-auto px-6 space-y-20">

          {/* Founder Feature Card */}
          {founder && (
            <section>
              <div
                className="rounded-2xl overflow-hidden shadow-lg border"
                style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-primary)' }}
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Portrait */}
                  <div className="relative w-full lg:w-[40%] shrink-0" style={{ minHeight: '360px' }}>
                    {founder.imageUrl ? (
                      <Image
                        src={founder.imageUrl}
                        alt={founder.imageAlt ?? founder.name}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        priority
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-primary-muted)' }}
                      >
                        <Users className="w-20 h-20" style={{ color: 'var(--color-primary)' }} />
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">
                    <div className="mb-4">
                      <span
                        className="inline-block text-xs font-body font-semibold px-3 py-1 rounded-full text-white mb-4"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        Founder &amp; Lead Physician
                      </span>
                    </div>
                    <h2 className="font-heading font-bold text-3xl mb-2" style={{ color: 'var(--color-text)' }}>
                      {founder.name}
                    </h2>
                    <p className="font-body text-base mb-1" style={{ color: 'var(--color-primary)' }}>
                      {founder.role}
                    </p>
                    <div className="flex items-center gap-2 mb-6" style={{ color: 'var(--color-muted)' }}>
                      <GraduationCap className="w-4 h-4 shrink-0" />
                      <span className="font-body text-sm">{founder.credentials}</span>
                    </div>
                    <p className="font-body text-base leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      {founder.bio}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Leadership Tier */}
          {leadership.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-8">
                <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--color-text)' }}>
                  Leadership
                </h2>
                <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {leadership.map((member) => (
                  <TeamMemberCard key={member.id} member={member} />
                ))}
              </div>
            </section>
          )}

          {/* Core Team */}
          {core.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-8">
                <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--color-text)' }}>
                  Core Team
                </h2>
                <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {core.map((member) => (
                  <TeamMemberCard key={member.id} member={member} />
                ))}
              </div>
            </section>
          )}

          {/* Join Us CTA */}
          <section
            className="rounded-2xl p-10 text-center"
            style={{ backgroundColor: 'var(--color-primary-muted)' }}
          >
            <h2 className="font-heading font-bold text-2xl mb-3" style={{ color: 'var(--color-primary)' }}>
              Interested in Volunteering?
            </h2>
            <p className="font-body text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              We welcome passionate clinicians, health communicators, and community mobilisers who share
              our mission for family health and holistic well-being.
            </p>
            <Link
              href="/contact"
              className="inline-block font-body font-semibold text-sm px-7 py-3 rounded-full text-white transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Get in Touch
            </Link>
          </section>
        </div>
      </main>
    </>
  )
}

function TeamMemberCard({ member }: { member: PublicTeamMember }) {
  return (
    <article
      className="rounded-xl overflow-hidden shadow-sm border flex flex-col"
      style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)' }}
    >
      {/* Photo */}
      <div className="relative w-full" style={{ aspectRatio: '3/4', maxHeight: '260px' }}>
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={member.imageAlt ?? member.name}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary-muted)' }}
          >
            <Users className="w-12 h-12" style={{ color: 'var(--color-primary)' }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading font-semibold text-lg mb-1" style={{ color: 'var(--color-text)' }}>
          {member.name}
        </h3>
        <p
          className="font-body text-sm mb-2 pl-2 border-l-2"
          style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
        >
          {member.role}
        </p>
        <div className="flex items-center gap-1.5 mb-3" style={{ color: 'var(--color-muted)' }}>
          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
          <span className="font-body text-xs">{member.credentials}</span>
        </div>
        <p
          className="font-body text-sm leading-relaxed line-clamp-3"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {member.bio}
        </p>
      </div>
    </article>
  )
}
