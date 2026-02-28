// Voice Service - Single Responsibility: handle voice processing and parsing

import { LogService } from './log.service'
import { CreateLogDto, Log, VoiceInputDto, VoiceOutputDto, ParsedLog, LogType } from '@/types'
import { createTranscriptParser } from '@/lib/ai/parser'
import { AI_PROVIDER } from '@/lib/ai/config'

// Baby-related keywords for validation
const BABY_KEYWORDS = [
  'baby', 'infant', 'newborn', 'little one', 'little one\'s',
  // Feeding
  'feed', 'ate', 'drank', 'nurse', 'nursing', 'bottle', 'breast', 'formula', 'milk', 'solid', 'food', 'oz', 'ml',
  // Sleep
  'sleep', 'slept', 'nap', 'napped', 'bed', 'bedtime', 'asleep', 'wake', 'woke', 'waking',
  // Diaper
  'diaper', 'wet', 'dirty', 'poop', 'poopy', 'pee', 'changed', ' poop ',
  // Misc
  'crying', 'fussy', 'happy', 'gassy', 'temperature', 'fever', 'medicine', 'doctor', 'appointment',
]

// Check if transcript contains baby-related keywords
function containsBabyKeyword(transcript: string): boolean {
  const lower = transcript.toLowerCase()
  return BABY_KEYWORDS.some(keyword => lower.includes(keyword))
}

export class VoiceService {
  private logService: LogService

  constructor(logService?: LogService) {
    this.logService = logService || new LogService()
  }

  async processVoiceInput(input: VoiceInputDto): Promise<VoiceOutputDto> {
    // Validate: Check for baby-related keywords first
    if (!containsBabyKeyword(input.transcript)) {
      throw new Error('UNRECOGNIZED_ACTIVITY')
    }

    // Step 1: Parse transcript with LLM
    const parser = createTranscriptParser(AI_PROVIDER)
    const parsed = await parser.parse(input.transcript)
    
    console.log('Voice service - parsed:', JSON.stringify(parsed))

    // Step 2: Validate the parsed result
    // REJECT always fails
    if (parsed.type === 'REJECT') {
      console.log('Voice service - rejected: REJECT type')
      throw new Error('UNRECOGNIZED_ACTIVITY')
    }
    
    // For NOTE type, verify it's actually meaningful baby content, not just keywords + gibberish
    if (parsed.type === 'NOTE') {
      const transcriptLower = input.transcript.toLowerCase()
      const notesLower = (parsed.notes || '').toLowerCase()
      
      // Check if transcript is too short or is essentially just keywords
      const wordCount = input.transcript.trim().split(/\s+/).length
      if (wordCount < 3 && !notesLower.includes('baby')) {
        console.log('Voice service - rejected: too short/meaningless note')
        throw new Error('UNRECOGNIZED_ACTIVITY')
      }
    }
    
    // For FEEDING, SLEEP, DIAPER require amount > 0 (skip confidence check as AI underestimates)
    if (parsed.type !== 'NOTE') {
      const hasAmount = parsed.amount !== undefined && parsed.amount !== null && parsed.amount > 0
      
      console.log('Voice service - validation check:', { type: parsed.type, confidence: parsed.confidence, amount: parsed.amount, hasAmount })
      
      if (!hasAmount) {
        console.log('Voice service - rejected: missing/invalid amount')
        throw new Error('UNRECOGNIZED_ACTIVITY')
      }
    }
    // NOTES are always accepted if not REJECT and pass basic checks

    // Step 3: Convert parsed data to log format
    const logData = this.convertToLogData(input.babyId, input.transcript, parsed)

    // Step 4: Create log in database
    const log = await this.logService.createLog(logData)

    return {
      log,
      parsed: {
        type: parsed.type,
        confidence: parsed.confidence,
      },
    }
  }

  private convertToLogData(
    babyId: string,
    rawTranscript: string,
    parsed: ParsedLog
  ): CreateLogDto {
    return {
      babyId,
      type: parsed.type as LogType,
      startTime: this.parseTime(parsed.startTime),
      endTime: parsed.endTime ? this.parseTime(parsed.endTime) : undefined,
      amount: parsed.amount,
      unit: parsed.unit,
      rawTranscript,
      notes: parsed.notes,
    }
  }

  private parseTime(timeInput: string): Date {
    const now = new Date()

    if (timeInput.toLowerCase() === 'now') {
      return now
    }

    const isoDate = new Date(timeInput)
    if (!isNaN(isoDate.getTime())) {
      return isoDate
    }

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

    return now
  }
}
