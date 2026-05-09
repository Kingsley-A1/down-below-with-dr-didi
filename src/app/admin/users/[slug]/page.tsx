import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import AdminUserDetailClient from '@/components/admin/AdminUserDetailClient'

interface AdminUserDetailPageProps {
  params: {
    slug: string
  }
}

/**
 * Server-side wrapper for admin user detail page
 * Redirects to login if not authenticated, checks for admin role
 */
export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const session = await getSession()

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login')
  }

  // Redirect to home if not admin
  if (session.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdminUserDetailClient userId={params.slug} currentAdminEmail={session.email} />
      </div>
    </div>
  )
}
