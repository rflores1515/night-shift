// Log Types - Single Responsibility: represent domain types

import { DefaultSession } from "next-auth"

export type LogType = 'FEEDING' | 'SLEEP' | 'DIAPER' | 'NOTE'

export type ParsedLogType = LogType | 'REJECT'

// Extend NextAuth session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

export interface User {
  id: string
  email: string
  name?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Baby {
  id: string
  name: string
  birthDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateBabyDto {
  name: string
  birthDate: Date
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

export interface ParsedLog {
  type: ParsedLogType
  startTime: string
  endTime?: string
  amount?: number
  unit?: string
  notes?: string
  confidence: number
}
