import { canonicalUrl, siteConfig } from '@/lib/site-config'

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export default function StructuredData() {
  const logoUrl = canonicalUrl('/logo.jpg')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['MedicalOrganization', 'NGO'],
        '@id': canonicalUrl('/#organization'),
        name: siteConfig.name,
        alternateName: siteConfig.alternateNames,
        url: canonicalUrl('/'),
        logo: logoUrl,
        image: logoUrl,
        description: siteConfig.description,
        founder: {
          '@type': 'Person',
          name: siteConfig.founderName,
        },
        areaServed: [
          {
            '@type': 'Country',
            name: 'Nigeria',
          },
          {
            '@type': 'AdministrativeArea',
            name: 'Cross River State',
          },
        ],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Calabar',
          addressRegion: 'Cross River State',
          addressCountry: 'NG',
        },
        email: siteConfig.contactEmail,
        medicalSpecialty: [
          'ReproductiveHealth',
          'Obstetric',
          'Gynecologic',
          'CommunityHealth',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': canonicalUrl('/#website'),
        name: siteConfig.name,
        alternateName: siteConfig.alternateNames,
        url: canonicalUrl('/'),
        description: siteConfig.description,
        publisher: {
          '@id': canonicalUrl('/#organization'),
        },
        inLanguage: 'en-NG',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${canonicalUrl('/library')}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  )
}
