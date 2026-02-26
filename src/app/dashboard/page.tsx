// Dashboard Page - Main view for logging and viewing baby logs

'use client'

import { useState, useEffect } from 'react'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { CalendarView } from '@/components/CalendarView'
import { InsightCard } from '@/components/InsightCard'
import { Log, WeeklyInsights } from '@/types'
import { Sparkles } from 'lucide-react'

// Demo baby ID - in production this would come from auth
const DEMO_BABY_ID = 'demo-baby'

export default function DashboardPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [insights, setInsights] = useState<WeeklyInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [showInsights, setShowInsights] = useState(true)

  useEffect(() => {
    fetchLogs()
    fetchInsights()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/logs?babyId=${DEMO_BABY_ID}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
  }

  const fetchInsights = async () => {
    try {
      const response = await fetch(`/api/insights?babyId=${DEMO_BABY_ID}`)
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
    fetchLogs()
    fetchInsights()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Night Shift</h1>
            <p className="text-sm text-gray-500 hidden sm:block">Track your baby&apos;s day</p>
          </div>

          {/* Insights toggle button - desktop only */}
          {insights && (
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
          <VoiceRecorder babyId={DEMO_BABY_ID} onLogCreated={handleLogCreated} />
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
          <VoiceRecorder babyId={DEMO_BABY_ID} onLogCreated={handleLogCreated} />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar - takes 3 columns on large screens */}
          <div className="lg:col-span-3">
            <CalendarView logs={logs} />
          </div>

          {/* Sidebar with insights */}
          <div className="lg:col-span-1">
            {showInsights && insights && (
              <div className="sticky top-20">
                <InsightCard insights={insights} isLoading={insightsLoading} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
