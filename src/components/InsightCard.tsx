// InsightCard Component - Single Responsibility: display AI insights

import { WeeklyInsights } from '@/types'
import { Sparkles } from 'lucide-react'

interface InsightCardProps {
  insights: WeeklyInsights
  isLoading?: boolean
}

export function InsightCard({ insights, isLoading }: InsightCardProps) {
  if (isLoading) {
    return (
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Weekly Insights</h3>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-blue-200 rounded w-3/4" />
          <div className="h-4 bg-blue-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="font-medium text-blue-900">Weekly Insights</h3>
      </div>

      <p className="text-sm text-blue-800 mb-4">{insights.summary}</p>

      {insights.patterns.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-blue-700 uppercase mb-1">
            Patterns
          </h4>
          <ul className="space-y-1">
            {insights.patterns.map((pattern, index) => (
              <li key={index} className="text-sm text-blue-800">
                • {pattern}
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.suggestions.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-blue-700 uppercase mb-1">
            Suggestions
          </h4>
          <ul className="space-y-1">
            {insights.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-800">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default InsightCard
