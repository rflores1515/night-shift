// Dashboard Page - Main view for logging and viewing baby logs

'use client'

import { useState, useEffect, useCallback } from 'react'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { CalendarView } from '@/components/CalendarView'
import { InsightCard } from '@/components/InsightCard'
import { BabySelector } from '@/components/BabySelector'
import { AddBabyModal } from '@/components/AddBabyModal'
import { Log, WeeklyInsights, Baby } from '@/types'
import { Sparkles, Plus } from 'lucide-react'

// Demo baby ID - in production this would come from auth
// const DEMO_BABY_ID = 'demo-baby'

export default function DashboardPage() {
  const [babies, setBabies] = useState<Baby[]>([])
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null)
  const [isAddBabyModalOpen, setIsAddBabyModalOpen] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [insights, setInsights] = useState<WeeklyInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [showInsights, setShowInsights] = useState(true)
  const [isLoadingBabies, setIsLoadingBabies] = useState(true)

  // Fetch babies on mount
  useEffect(() => {
    fetchBabies()
  }, [])

  // Fetch logs and insights when selected baby changes
  useEffect(() => {
    if (selectedBaby) {
      fetchLogs(selectedBaby.id)
      fetchInsights(selectedBaby.id)
    } else {
      setLogs([])
      setInsights(null)
      setInsightsLoading(false)
    }
  }, [selectedBaby])

  const fetchBabies = async () => {
    try {
      const response = await fetch('/api/babies')
      if (response.ok) {
        const data = await response.json()
        setBabies(data)
        // Set first baby as default if available
        if (data.length > 0) {
          setSelectedBaby(data[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch babies:', error)
    } finally {
      setIsLoadingBabies(false)
    }
  }

  const handleAddBaby = useCallback(async (name: string, birthDate: Date) => {
    try {
      const response = await fetch('/api/babies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, birthDate: birthDate.toISOString() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create baby')
      }

      const newBaby = await response.json()
      setBabies((prev) => [...prev, newBaby])
      setSelectedBaby(newBaby)
    } catch (error) {
      console.error('Failed to create baby:', error)
      throw error
    }
  }, [])

  const fetchLogs = async (babyId: string) => {
    try {
      const response = await fetch(`/api/logs?babyId=${babyId}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }

  const fetchInsights = async (babyId: string) => {
    setInsightsLoading(true)
    try {
      const response = await fetch(`/api/insights?babyId=${babyId}`)
      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error)
    } finally {
      setInsightsLoading(false)
    }
  }

  const handleLogCreated = () => {
    if (selectedBaby) {
      fetchLogs(selectedBaby.id)
      fetchInsights(selectedBaby.id)
    }
  }

  const handleSelectBaby = (baby: Baby) => {
    setSelectedBaby(baby)
  }

  const handleAddBabyClick = () => {
    setIsAddBabyModalOpen(true)
  }

  // Show loading state while fetching babies
  if (isLoadingBabies) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  // Show empty state if no babies exist
  if (babies.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Night Shift</h1>
              <p className="text-sm text-gray-500 hidden sm:block">Track your baby&apos;s day</p>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto p-6 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Plus className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Welcome to Night Shift</h2>
            <p className="text-gray-600 max-w-xs">
              Add your first baby to start tracking their feeding, sleep, and diaper changes.
            </p>
            <button
              onClick={handleAddBabyClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your Baby
            </button>
          </div>

          <AddBabyModal
            isOpen={isAddBabyModalOpen}
            onClose={() => setIsAddBabyModalOpen(false)}
            onSubmit={handleAddBaby}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Night Shift</h1>
              <p className="text-sm text-gray-500 hidden sm:block">Track your baby&apos;s day</p>
            </div>
            {/* Baby Selector */}
            {babies.length > 0 && (
              <BabySelector
                babies={babies}
                selectedBaby={selectedBaby}
                onSelectBaby={handleSelectBaby}
                onAddBaby={handleAddBabyClick}
              />
            )}
          </div>

          {/* Insights toggle button - desktop only */}
          {insights && selectedBaby && (
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {showInsights ? 'Hide Insights' : 'Show Insights'}
            </button>
          )}
        </div>
      </header>

      {/* Mobile: stacked layout */}
      <main className="md:hidden max-w-md mx-auto p-4 space-y-6">
        {/* Voice Recorder */}
        <section>
          {selectedBaby && (
            <VoiceRecorder babyId={selectedBaby.id} onLogCreated={handleLogCreated} />
          )}
        </section>

        {/* Weekly Insights - always visible on mobile */}
        {insights && (
          <section>
            <InsightCard insights={insights} isLoading={insightsLoading} />
          </section>
        )}

        {/* Calendar View */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Logs</h2>
          <CalendarView logs={logs} />
        </section>
      </main>

      {/* Desktop: side-by-side layout */}
      <main className="hidden md:block max-w-7xl mx-auto p-6">
        {/* Top bar with voice recorder */}
        <div className="mb-6">
          {selectedBaby && (
            <VoiceRecorder babyId={selectedBaby.id} onLogCreated={handleLogCreated} />
          )}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar - takes 3 columns on large screens */}
          <div className="lg:col-span-3">
            <CalendarView logs={logs} />
          </div>

          {/* Sidebar with insights */}
          <div className="lg:col-span-1">
            {showInsights && insights && selectedBaby && (
              <div className="sticky top-20">
                <InsightCard insights={insights} isLoading={insightsLoading} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Baby Modal */}
      <AddBabyModal
        isOpen={isAddBabyModalOpen}
        onClose={() => setIsAddBabyModalOpen(false)}
        onSubmit={handleAddBaby}
      />
    </div>
  )
}
