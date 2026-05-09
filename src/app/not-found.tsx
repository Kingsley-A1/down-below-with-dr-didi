import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      <div className="text-center text-white">
        <SearchX size={72} className="mx-auto mb-6" style={{ color: 'var(--color-accent)' }} />
        <h1 className="font-heading font-bold text-7xl mb-4">404</h1>
        <p className="font-heading text-2xl mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Page not found
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-body font-semibold px-8 py-4 rounded-full transition-all hover:scale-105"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
