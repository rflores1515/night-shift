// CalendarView Component - Outlook-style calendar for baby logs
// Supports daily and weekly views with navigation

'use client'

import { useState, useMemo } from 'react'
import { Log, LogType } from '@/types'
import { LogCard } from './LogCard'
import {
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isSameDay,
  isToday,
  differenceInMinutes,
  eachHourOfInterval,
  parseISO,
} from 'date-fns'

type ViewMode = 'daily' | 'weekly'

interface CalendarViewProps {
  logs: Log[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

// Log type colors for timeline
const typeColors: Record<LogType, string> = {
  FEEDING: 'bg-green-500',
  SLEEP: 'bg-purple-500',
  DIAPER: 'bg-yellow-500',
  NOTE: 'bg-blue-500',
}

function getLogTypeColor(type: LogType): string {
  return typeColors[type] || 'bg-gray-500'
}

export function CalendarView({ logs }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly')
  const [currentDate, setCurrentDate] = useState(new Date())

  // Group logs by date for quick lookup
  const logsByDate = useMemo(() => {
    const map = new Map<string, Log[]>()
    for (const log of logs) {
      const dateKey = format(new Date(log.startTime), 'yyyy-MM-dd')
      const existing = map.get(dateKey) || []
      map.set(dateKey, [...existing, log])
    }
    return map
  }, [logs])

  // Navigation handlers
  const goToPrevious = () => {
    if (viewMode === 'daily') {
      setCurrentDate(subDays(currentDate, 1))
    } else {
      setCurrentDate(subWeeks(currentDate, 1))
    }
  }

  const goToNext = () => {
    if (viewMode === 'daily') {
      setCurrentDate(addDays(currentDate, 1))
    } else {
      setCurrentDate(addWeeks(currentDate, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getTitle = () => {
    if (viewMode === 'daily') {
      if (isToday(currentDate)) return 'Today'
      return format(currentDate, 'EEEE, MMMM d')
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      if (format(weekStart, 'MMM') === format(weekEnd, 'MMM')) {
        return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}`
      }
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    }
  }

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [currentDate])

  const getLogsForDay = (date: Date): Log[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return logsByDate.get(dateKey) || []
  }

  const getLogsForHour = (date: Date, hour: number): Log[] => {
    const dayLogs = getLogsForDay(date)
    return dayLogs.filter((log) => {
      const logDate = new Date(log.startTime)
      return logDate.getHours() === hour
    })
  }

  // Calculate position for log in timeline
  const getLogPosition = (log: Log) => {
    const logDate = new Date(log.startTime)
    const minutes = logDate.getHours() * 60 + logDate.getMinutes()
    const top = (minutes / 60) * 48 // 48px per hour
    return { top }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900 ml-2">
            {getTitle()}
          </h3>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'daily'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Daily</span>
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'weekly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Weekly</span>
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      <div className="overflow-auto">
        {viewMode === 'weekly' ? (
          <WeeklyView
            weekDays={weekDays}
            getLogsForDay={getLogsForDay}
            isToday={isToday}
          />
        ) : (
          <DailyView
            date={currentDate}
            getLogsForHour={getLogsForHour}
            isToday={isToday(currentDate)}
          />
        )}
      </div>
    </div>
  )
}

// Weekly view component - 7 column grid
interface WeeklyViewProps {
  weekDays: Date[]
  getLogsForDay: (date: Date) => Log[]
  isToday: (date: Date) => boolean
}

function WeeklyView({ weekDays, getLogsForDay, isToday }: WeeklyViewProps) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="min-w-[600px] lg:min-w-[800px]">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`p-3 lg:p-4 text-center border-r last:border-r-0 ${
              isToday(day) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="text-xs lg:text-sm text-gray-500 font-medium">
              {dayNames[index]}
            </div>
            <div
              className={`text-lg lg:text-xl font-semibold mt-1 ${
                isToday(day) ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Day columns with logs */}
      <div className="grid grid-cols-7 min-h-[300px] lg:min-h-[400px]">
        {weekDays.map((day, index) => {
          const dayLogs = getLogsForDay(day)
          return (
            <div
              key={index}
              className={`p-2 lg:p-3 border-r last:border-r-0 ${
                isToday(day) ? 'bg-blue-50/50' : ''
              }`}
            >
              {dayLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-xs text-gray-400">No logs</span>
                </div>
              ) : (
                <div className="space-y-1.5 lg:space-y-2">
                  {dayLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`${getLogTypeColor(log.type)} text-white text-xs lg:text-sm p-1.5 lg:p-2 rounded truncate`}
                    >
                      <span className="font-medium">
                        {format(new Date(log.startTime), 'h:mm a')}
                      </span>
                      <span className="ml-1">{log.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Daily view component - hourly timeline
interface DailyViewProps {
  date: Date
  getLogsForHour: (date: Date, hour: number) => Log[]
  isToday: boolean
}

function DailyView({ date, getLogsForHour, isToday }: DailyViewProps) {
  const hours = eachHourOfInterval({
    start: startOfDay(date),
    end: endOfDay(date),
  })

  return (
    <div className="min-w-[400px]">
      {/* Mobile: stacked view for small screens */}
      <div className="md:hidden">
        {hours.map((hour) => {
          const hourLogs = getLogsForHour(date, hour.getHours())
          return (
            <div
              key={hour.getHours()}
              className="flex border-b last:border-b-0"
            >
              <div className="w-16 flex-shrink-0 p-2 text-xs text-gray-500 font-medium text-right border-r bg-gray-50">
                {format(hour, 'h a')}
              </div>
              <div className="flex-1 p-2 min-h-[48px]">
                {hourLogs.length === 0 ? null : (
                  <div className="space-y-1">
                    {hourLogs.map((log) => (
                      <LogCard key={log.id} log={log} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: side-by-side timeline */}
      <div className="hidden md:block">
        {hours.map((hour) => {
          const hourLogs = getLogsForHour(date, hour.getHours())
          return (
            <div
              key={hour.getHours()}
              className="flex border-b last:border-b-0"
            >
              <div className="w-20 flex-shrink-0 p-3 text-sm text-gray-500 font-medium text-right border-r bg-gray-50">
                {format(hour, 'h:mm a')}
              </div>
              <div className="flex-1 p-2 min-h-[48px] relative">
                {hourLogs.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-gray-300">-</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {hourLogs.map((log) => (
                      <LogCard key={log.id} log={log} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarView
