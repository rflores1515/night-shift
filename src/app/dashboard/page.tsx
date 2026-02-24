// Dashboard Page - Main view for logging and viewing baby logs

'use client'

import { useState, useEffect } from 'react'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { LogTimeline } from '@/components/LogTimeline'
import { InsightCard } from '@/components/InsightCard'
import { Log, WeeklyInsights } from '@/types'

// Demo baby ID - in production this would come from auth
const DEMO_BABY_ID = 'demo-baby'

export default function DashboardPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [insights, setInsights] = useState<WeeklyInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(true)

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
      <header className="bg-white border-b px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Night Shift</h1>
        <p className="text-sm text-gray-500">Track your baby&apos;s day</p>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Voice Recorder */}
        <section>
          <VoiceRecorder babyId={DEMO_BABY_ID} onLogCreated={handleLogCreated} />
        </section>

        {/* Weekly Insights */}
        {insights && (
          <section>
            <InsightCard insights={insights} isLoading={insightsLoading} />
          </section>
        )}

        {/* Log Timeline */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Logs</h2>
          <LogTimeline logs={logs} />
        </section>
      </main>
    </div>
  )
}
