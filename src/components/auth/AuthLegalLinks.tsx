import Link from 'next/link'

export default function AuthLegalLinks() {
  return (
    <p className="text-center font-body text-xs text-slate-500">
      Optional: review our{' '}
      <Link href="/terms" className="font-semibold text-slate-700 underline underline-offset-4">
        Terms
      </Link>{' '}
      and{' '}
      <Link href="/privacy" className="font-semibold text-slate-700 underline underline-offset-4">
        Privacy Policy
      </Link>
      .
    </p>
  )
}
