import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/admin/user-repository'
import { ProfileForm } from '@/components/auth/ProfileForm'

export default async function MePage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const user = await getUserById(session.userId)

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your Down Below with Dr. Didi account
          </p>
        </div>

        <ProfileForm initialUser={user} />
      </div>
    </main>
  )
}
