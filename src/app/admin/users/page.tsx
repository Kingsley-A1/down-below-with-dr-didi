import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import AdminUsersListClient from '@/components/admin/AdminUsersListClient'

/**
 * Server-side wrapper for admin users list page
 * Redirects to login if not authenticated, checks for admin role
 */
export default async function AdminUsersPage() {
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">
            Manage all users, view their profiles, and control their account status
          </p>
        </div>

        <AdminUsersListClient />
      </div>
    </div>
  )
}
