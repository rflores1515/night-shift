'use client'

// LoginForm Component - Magic link login form

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Mail, Loader2, ArrowRight } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (!email.trim()) {
      setError('Please enter your email address')
      setIsLoading(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn('resend', {
        email: email.trim(),
        redirect: false,
      })

      if (result?.error) {
        setError('Failed to send magic link. Please try again.')
      } else {
        setIsSent(true)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Check your email
        </h2>
        <p className="text-gray-600 mb-6">
          We sent a magic link to <span className="font-medium">{email}</span>
        </p>
        <p className="text-sm text-gray-500">
          Click the link in the email to sign in. The link expires in 24 hours.
        </p>
        <button
          onClick={() => {
            setIsSent(false)
            setEmail('')
          }}
          className="mt-6 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending magic link...
          </>
        ) : (
          <>
            Send Magic Link
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        We'll email you a magic link for a password-free sign in.
      </p>
    </form>
  )
}

export default LoginForm
