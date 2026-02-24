// LogTimeline Component - Single Responsibility: display logs in chronological order
// Follows Single Responsibility: only renders log timeline

import { Log } from '@/types'
import { LogCard } from './LogCard'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'

interface LogTimelineProps {
  logs: Log[]
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  if (isThisWeek(date)) return format(date, 'EEEE')
  return format(date, 'MMMM d, yyyy')
}

function groupLogsByDate(logs: Log[]): Map<string, Log[]> {
  const groups = new Map<string, Log[]>()

  for (const log of logs) {
    const dateKey = format(new Date(log.startTime), 'yyyy-MM-dd')
    const existing = groups.get(dateKey) || []
    groups.set(dateKey, [...existing, log])
  }

  return groups
}

export function LogTimeline({ logs }: LogTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No logs yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Tap the microphone to add your first log
        </p>
      </div>
    )
  }

  const groupedLogs = groupLogsByDate(logs)
  const sortedDates = Array.from(groupedLogs.keys()).sort((a, b) =>
    b.localeCompare(a)
  )

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const dateLogs = groupedLogs.get(dateKey) || []
        const date = new Date(dateKey)

        return (
          <div key={dateKey}>
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              {getDateLabel(date)}
            </h3>
            <div className="space-y-3">
              {dateLogs.map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default LogTimeline
