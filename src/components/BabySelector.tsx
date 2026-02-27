'use client'

// BabySelector Component - Dropdown to switch between babies

import { useState, useRef, useEffect } from 'react'
import { Baby } from '@/types'
import { ChevronDown, Plus, User } from 'lucide-react'

interface BabySelectorProps {
  babies: Baby[]
  selectedBaby: Baby | null
  onSelectBaby: (baby: Baby) => void
  onAddBaby: () => void
}

export function BabySelector({
  babies,
  selectedBaby,
  onSelectBaby,
  onAddBaby,
}: BabySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-w-[140px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select baby"
      >
        <User className="w-4 h-4 text-gray-500" />
        <span className="flex-1 text-left text-sm font-medium text-gray-900 truncate">
          {selectedBaby?.name || 'Select baby'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white rounded-lg shadow-lg border py-1 z-50">
          {babies.length > 0 ? (
            <>
              {babies.map((baby) => (
                <button
                  key={baby.id}
                  onClick={() => {
                    onSelectBaby(baby)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                    selectedBaby?.id === baby.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="truncate">{baby.name}</span>
                </button>
              ))}
              <div className="border-t my-1" />
            </>
          ) : null}

          <button
            onClick={() => {
              setIsOpen(false)
              onAddBaby()
            }}
            className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add new baby
          </button>
        </div>
      )}
    </div>
  )
}

export default BabySelector
