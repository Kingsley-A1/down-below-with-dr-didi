import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Create an account
          </h2>
          <p className="mb-8 text-center text-sm text-gray-600">
            Join DownBelow Family Health Initiative with Dr Didi
          </p>
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}
