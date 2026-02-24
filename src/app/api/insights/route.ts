// Insights API Route - Thin controller following SOC

import { NextRequest, NextResponse } from 'next/server'
import { InsightsService } from '@/services/insights.service'

const insightsService = new InsightsService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const babyId = searchParams.get('babyId')
    const week = searchParams.get('week')

    if (!babyId) {
      return NextResponse.json(
        { error: 'Missing required query param: babyId' },
        { status: 400 }
      )
    }

    // Parse week offset from "2024-W05" format or use default (current week)
    let weekOffset = 0
    if (week) {
      const weekNum = parseInt(week.split('-W')[1], 10)
      const year = parseInt(week.split('-W')[0], 10)
      const currentWeek = getCurrentWeekNumber(new Date())
      const currentYear = new Date().getFullYear()
      weekOffset = currentYear === year ? currentWeek - weekNum : 0
    }

    const insights = await insightsService.getWeeklyInsights(babyId, weekOffset)

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Get insights error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

function getCurrentWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
