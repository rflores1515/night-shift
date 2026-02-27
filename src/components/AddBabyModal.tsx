'use client'

// AddBabyModal Component - Modal form to create a new baby

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Calendar } from 'lucide-react'

interface AddBabyModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, birthDate: Date) => Promise<void>
}

export function AddBabyModal({ isOpen, onClose, onSubmit }: AddBabyModalProps) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameInputRef = useRef<HTMLInputElement>(null)

  // Focus name input when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setBirthDate('')
      setError(null)
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Close modal on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter your baby\'s name')
      return
    }

    if (!birthDate) {
      setError('Please select your baby\'s birth date')
      return
    }

    const selectedDate = new Date(birthDate)
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    if (selectedDate > today) {
      setError('Birth date cannot be in the future')
      return
    }

    setIsLoading(true)

    try {
      await onSubmit(name.trim(), selectedDate)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create baby')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate max date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add New Baby</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="baby-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Baby&apos;s Name
            </label>
            <input
              ref={nameInputRef}
              id="baby-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., Emma"
              maxLength={50}
            />
          </div>

          <div>
            <label
              htmlFor="birth-date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Birth Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={today}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Baby'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBabyModal
