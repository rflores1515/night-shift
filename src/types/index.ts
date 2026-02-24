// Log Types - Single Responsibility: represent domain types

export type LogType = 'FEEDING' | 'SLEEP' | 'DIAPER' | 'NOTE'

export interface Baby {
  id: string
  name: string
  birthDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface Log {
  id: string
  babyId: string
  type: LogType
  startTime: Date
  endTime?: Date
  amount?: number
  unit?: string
  rawTranscript: string
  notes?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

// DTOs for API requests/responses
export interface CreateLogDto {
  babyId: string
  type: LogType
  startTime: Date
  endTime?: Date
  amount?: number
  unit?: string
  rawTranscript: string
  notes?: string
  metadata?: Record<string, unknown>
}

export interface VoiceInputDto {
  transcript: string
  babyId: string
}

export interface VoiceOutputDto {
  log: Log
  parsed: {
    type: LogType
    confidence: number
  }
}

export interface InsightsQueryDto {
  babyId: string
  week?: string // ISO week format e.g., "2024-W05"
}

export interface WeeklyInsights {
  summary: string
  patterns: string[]
  suggestions: string[]
}
