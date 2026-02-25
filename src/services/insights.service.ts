// Insights Service - Single Responsibility: generate AI-powered insights
// Dependency Inversion: depends on abstractions for logs and AI

import { prisma } from '@/lib/prisma'
import { Baby, WeeklyInsights } from '@/types'
import { createInsightGenerator, LogEntry } from '@/lib/ai/parser'
import { AI_PROVIDER } from '@/lib/ai/config'

export class InsightsService {
  async getWeeklyInsights(babyId: string, weekOffset: number = 0): Promise<WeeklyInsights> {
    const baby = await prisma.baby.findUnique({ where: { id: babyId } })
    if (!baby) {
      return {
        summary: 'Baby not found',
        patterns: [],
        suggestions: [],
      }
    }

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - weekOffset * 7)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

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

    if (logs.length === 0) {
      return {
        summary: `No logs recorded for ${baby.name} this week.`,
        patterns: ['No data available to analyze'],
        suggestions: ['Start logging to get personalized insights'],
      }
    }

    const logData: LogEntry[] = logs.map((log) => ({
      type: log.type,
      startTime: log.startTime,
      amount: log.amount ?? undefined,
      unit: log.unit ?? undefined,
      notes: log.notes ?? undefined,
    }))

    const generator = createInsightGenerator(AI_PROVIDER)
    return await generator.generate(baby.name, logData)
  }

  async getBabyById(babyId: string): Promise<Baby | null> {
    return await prisma.baby.findUnique({ where: { id: babyId } })
  }
}
