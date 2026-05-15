import { Suspense } from 'react'
import AuthLegalLinks from '@/components/auth/AuthLegalLinks'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Set your new password
          </h2>
          <p className="mb-8 text-center text-sm text-gray-600">
            Create a strong password to secure your account
          </p>
          <Suspense
            fallback={
              <div className="rounded-md bg-gray-100 p-4 text-sm text-gray-700">Loading reset form...</div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
          <div className="mt-6">
            <AuthLegalLinks />
          </div>
        </div>
      </div>
    </main>
  )
}
