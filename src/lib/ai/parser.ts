// AI Parser Interface - Abstraction layer for LLM providers

import { ParsedLog, WeeklyInsights } from '@/types'

export interface ITranscriptParser {
  parse(transcript: string): Promise<ParsedLog>
}

export interface IInsightGenerator {
  generate(babyName: string, logs: LogEntry[]): Promise<WeeklyInsights>
}

export interface LogEntry {
  type: string
  startTime: Date
  amount?: number
  unit?: string
  notes?: string
}

// Default implementations - can be swapped
export type ParserProvider = 'openai' | 'anthropic'

export function createTranscriptParser(provider: ParserProvider): ITranscriptParser {
  if (provider === 'openai') {
    return new OpenAITranscriptParser()
  }
  return new AnthropicTranscriptParser()
}

export function createInsightGenerator(provider: ParserProvider): IInsightGenerator {
  if (provider === 'openai') {
    return new OpenAIInsightGenerator()
  }
  return new AnthropicInsightGenerator()
}

// Imports from implementations
import { OpenAITranscriptParser, OpenAIInsightGenerator } from './openai'
import { AnthropicTranscriptParser, AnthropicInsightGenerator } from './anthropic'
