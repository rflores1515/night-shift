// Login Page - Magic link authentication

import { LoginForm } from '@/components/LoginForm'
import { Baby } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Logo/Brand */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Baby className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Night Shift</h1>
        <p className="text-gray-600 mb-8 text-center max-w-sm">
          Track your baby&apos;s feeding, sleep, and diaper changes with simple voice notes
        </p>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <LoginForm />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-400">
        <p>Made with love for tired parents</p>
      </footer>
    </div>
  )
}
