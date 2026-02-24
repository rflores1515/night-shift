// Voice Service - Single Responsibility: handle voice processing and parsing
// Follows Interface Segregation: focused on voice-related operations

import { parseVoiceTranscript, ParsedLog } from '@/lib/anthropic'
import { LogService } from './log.service'
import { CreateLogDto, Log, VoiceInputDto, VoiceOutputDto } from '@/types'

export class VoiceService {
  private logService: LogService

  constructor(logService?: LogService) {
    this.logService = logService || new LogService()
  }

  async processVoiceInput(input: VoiceInputDto): Promise<VoiceOutputDto> {
    // Step 1: Parse transcript with LLM
    const parsed = await this.parseTranscript(input.transcript)

    // Step 2: Convert parsed data to log format
    const logData = this.convertToLogData(input.babyId, input.transcript, parsed)

    // Step 3: Create log in database
    const log = await this.logService.createLog(logData)

    return {
      log,
      parsed: {
        type: parsed.type,
        confidence: parsed.confidence,
      },
    }
  }

  private async parseTranscript(transcript: string): Promise<ParsedLog> {
    return await parseVoiceTranscript(transcript)
  }

  private convertToLogData(
    babyId: string,
    rawTranscript: string,
    parsed: ParsedLog
  ): CreateLogDto {
    return {
      babyId,
      type: parsed.type,
      startTime: this.parseTime(parsed.startTime),
      endTime: parsed.endTime ? this.parseTime(parsed.endTime) : undefined,
      amount: parsed.amount,
      unit: parsed.unit,
      rawTranscript,
      notes: parsed.notes,
    }
  }

  private parseTime(timeInput: string): Date {
    // Handle relative times like "now", "5 minutes ago"
    const now = new Date()

    if (timeInput.toLowerCase() === 'now') {
      return now
    }

    // Try parsing as ISO timestamp first
    const isoDate = new Date(timeInput)
    if (!isNaN(isoDate.getTime())) {
      return isoDate
    }

    // Handle relative time expressions
    const minutesMatch = timeInput.match(/(\d+)\s*minutes?\s*ago/i)
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1], 10)
      return new Date(now.getTime() - minutes * 60 * 1000)
    }

    const hoursMatch = timeInput.match(/(\d+)\s*hours?\s*ago/i)
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1], 10)
      return new Date(now.getTime() - hours * 60 * 60 * 1000)
    }

    // Default to current time if parsing fails
    return now
  }
}
