// Log Service - Single Responsibility: handle log business logic
// Open/Closed: extend via new methods, not modification
// Dependency Inversion: depends on abstractions (interfaces)

import { prisma } from '@/lib/prisma'
import { Log, CreateLogDto, LogType } from '@/types'

export interface ILogRepository {
  create(data: CreateLogDto): Promise<Log>
  findById(id: string): Promise<Log | null>
  findByBabyId(babyId: string, startDate?: Date, endDate?: Date): Promise<Log[]>
  update(id: string, data: Partial<CreateLogDto>): Promise<Log>
  delete(id: string): Promise<void>
}

class LogRepository implements ILogRepository {
  async create(data: CreateLogDto): Promise<Log> {
    return await prisma.log.create({
      data: {
        babyId: data.babyId,
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        amount: data.amount,
        unit: data.unit,
        rawTranscript: data.rawTranscript,
        notes: data.notes,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: data.metadata as any,
      },
    }) as Log
  }

  async findById(id: string): Promise<Log | null> {
    return await prisma.log.findUnique({
      where: { id },
    }) as Log | null
  }

  async findByBabyId(babyId: string, startDate?: Date, endDate?: Date): Promise<Log[]> {
    const where: Record<string, unknown> = { babyId }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) (where.startTime as Record<string, Date>).gte = startDate
      if (endDate) (where.startTime as Record<string, Date>).lte = endDate
    }

    return (await prisma.log.findMany({
      where,
      orderBy: { startTime: 'desc' },
    })) as Log[]
  }

  async update(id: string, data: Partial<CreateLogDto>): Promise<Log> {
    return await prisma.log.update({
      where: { id },
      data: {
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        amount: data.amount,
        unit: data.unit,
        notes: data.notes,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: data.metadata as any,
      },
    }) as Log
  }

  async delete(id: string): Promise<void> {
    await prisma.log.delete({ where: { id } })
  }
}

// Singleton instance - Dependency Injection pattern
let logRepository: ILogRepository | null = null

export function getLogRepository(): ILogRepository {
  if (!logRepository) {
    logRepository = new LogRepository()
  }
  return logRepository
}

// Service layer - orchestrates business logic
export class LogService {
  private repository: ILogRepository

  constructor(repository?: ILogRepository) {
    this.repository = repository || getLogRepository()
  }

  async createLog(data: CreateLogDto): Promise<Log> {
    // Business logic: validate required fields
    if (!data.babyId) {
      throw new Error('babyId is required')
    }
    if (!data.type) {
      throw new Error('type is required')
    }
    if (!data.startTime) {
      throw new Error('startTime is required')
    }

    return await this.repository.create(data)
  }

  async getLog(id: string): Promise<Log | null> {
    return await this.repository.findById(id)
  }

  async getLogsByBaby(
    babyId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<Log[]> {
    return await this.repository.findByBabyId(babyId, options?.startDate, options?.endDate)
  }

  async updateLog(id: string, data: Partial<CreateLogDto>): Promise<Log> {
    return await this.repository.update(id, data)
  }

  async deleteLog(id: string): Promise<void> {
    await this.repository.delete(id)
  }

  async getLogsByType(babyId: string, type: LogType): Promise<Log[]> {
    const logs = await this.repository.findByBabyId(babyId)
    return logs.filter((log) => log.type === type)
  }

  async getWeeklyLogs(babyId: string, weekOffset: number = 0): Promise<Log[]> {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() - weekOffset * 7)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    return await this.repository.findByBabyId(babyId, startOfWeek, endOfWeek)
  }
}
