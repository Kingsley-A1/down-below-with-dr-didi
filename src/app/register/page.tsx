import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(11,78,65,0.1) 0%, rgba(11,78,65,0) 40%), radial-gradient(circle at 80% 80%, rgba(252,238,33,0.13) 0%, rgba(252,238,33,0) 36%)',
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="bg-white px-4 py-8 shadow-sm sm:rounded-2xl sm:px-10 border" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="mb-3 text-center text-3xl font-bold text-gray-900">
            Create an account
          </h2>
          <p className="mb-8 text-center text-sm text-gray-600 leading-relaxed">
            Join DownBelow Family Health Initiative with Dr Didi
          </p>
          <RegisterForm />
        </div>
      </div>
    </main>
  )
}
