export const PUBLIC_PLATFORM_PAGES = [
  { href: '/', label: 'Home', description: 'Default public landing page and hero experience.' },
  { href: '/events', label: 'Events', description: 'Live streams, upcoming events, and event archive.' },
  { href: '/library', label: 'Health Library', description: 'Published articles and public education resources.' },
  { href: '/outreach', label: 'Outreach', description: 'Community field work and impact gallery.' },
  { href: '/podcast', label: 'Podcast', description: 'Published podcast episodes and show notes.' },
  { href: '/vault', label: 'V-Vault', description: 'Anonymous question submission experience.' },
  { href: '/review', label: 'Reviews', description: 'Public testimonial and review submission page.' },
  { href: '/team', label: 'Team', description: 'Published team member profiles.' },
  { href: '/gallery', label: 'Gallery', description: 'Published photos and videos.' },
  { href: '/about', label: 'About', description: 'Mission, vision, and founder story.' },
  { href: '/contact', label: 'Contact', description: 'Booking and public contact channels.' },
]

export function getPublicPlatformPage(path: string | undefined) {
  return PUBLIC_PLATFORM_PAGES.find((page) => page.href === path) ?? PUBLIC_PLATFORM_PAGES[0]
}
