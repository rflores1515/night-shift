// LogCard Component - Single Responsibility: display a single log entry
// Follows Single Responsibility: only renders log data

import { Log, LogType } from '@/types'
import { format } from 'date-fns'

interface LogCardProps {
  log: Log
}

const typeColors: Record<LogType, string> = {
  FEEDING: 'bg-green-100 border-green-300',
  SLEEP: 'bg-purple-100 border-purple-300',
  DIAPER: 'bg-yellow-100 border-yellow-300',
  NOTE: 'bg-blue-100 border-blue-300',
}

const typeIcons: Record<LogType, string> = {
  FEEDING: '🍼',
  SLEEP: '😴',
  DIAPER: '👶',
  NOTE: '📝',
}

export function LogCard({ log }: LogCardProps) {
  const colorClass = typeColors[log.type]
  const icon = typeIcons[log.type]

  return (
    <div className={`p-4 rounded-lg border ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium">{log.type}</span>
        </div>
        <span className="text-sm text-gray-600">
          {format(new Date(log.startTime), 'h:mm a')}
        </span>
      </div>

      <div className="mt-2 space-y-1">
        {log.amount && (
          <p className="text-sm">
            <span className="font-medium">{log.amount}</span> {log.unit}
          </p>
        )}
        {log.notes && <p className="text-sm text-gray-700">{log.notes}</p>}
        {!log.amount && !log.notes && (
          <p className="text-sm text-gray-500 italic">No additional details</p>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {format(new Date(log.createdAt), 'MMM d, yyyy')}
      </p>
    </div>
  )
}

export default LogCard
