// Insights Service - Single Responsibility: generate AI-powered insights
// Dependency Inversion: depends on abstractions for logs and AI

import { generateWeeklyInsights, WeeklyInsights as AIWeeklyInsights } from '@/lib/anthropic'
import { prisma } from '@/lib/prisma'
import { Baby } from '@/types'

export class InsightsService {
  async getWeeklyInsights(babyId: string, weekOffset: number = 0): Promise<AIWeeklyInsights> {
    // Get baby info
    const baby = await prisma.baby.findUnique({ where: { id: babyId } })
    if (!baby) {
      return {
        summary: 'Baby not found',
        patterns: [],
        suggestions: [],
      }
    }

    // Calculate date range for the week
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - weekOffset * 7)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    // Fetch logs for the week
    const logs = await prisma.log.findMany({
      where: {
        babyId,
        startTime: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
      orderBy: { startTime: 'asc' },
    })

    // If no logs, return default response
    if (logs.length === 0) {
      return {
        summary: `No logs recorded for ${baby.name} this week.`,
        patterns: ['No data available to analyze'],
        suggestions: ['Start logging to get personalized insights'],
      }
    }

    // Transform logs for AI analysis
    const logData = logs.map((log) => ({
      type: log.type,
      startTime: log.startTime,
      amount: log.amount ?? undefined,
      unit: log.unit ?? undefined,
      notes: log.notes ?? undefined,
    }))

    // Generate insights using Claude
    return await generateWeeklyInsights(baby.name, logData)
  }

  async getBabyById(babyId: string): Promise<Baby | null> {
    return (await prisma.baby.findUnique({
      where: { id: babyId },
    })) as Baby | null
  }
}
