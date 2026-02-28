// OpenAI Implementation

import OpenAI from 'openai'
import { ParsedLog, WeeklyInsights } from '@/types'
import { ITranscriptParser, IInsightGenerator, LogEntry } from './parser'

// Lazy initialize OpenAI client to avoid build-time errors
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

const logSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['FEEDING', 'SLEEP', 'DIAPER', 'NOTE', 'REJECT'] },
    amount: { type: 'number' },
    unit: { type: 'string' },
    notes: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    rejectionReason: { type: 'string' },
  },
  required: ['type', 'confidence'],
  additionalProperties: false,
}

export class OpenAITranscriptParser implements ITranscriptParser {
  async parse(transcript: string): Promise<ParsedLog> {
    try {
      const response = await getOpenAIClient().responses.create({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content: `You are a baby log parser. Analyze the transcript and extract:
- type: FEEDING (bottle, formula, breast, solid), SLEEP (nap, sleep), DIAPER (wet, dirty, change), NOTE (anything else), REJECT (nonsense, unrelated to baby care)
- amount: numeric value if mentioned
- unit: oz, ml, minutes, hours
- notes: additional details
- confidence: 0-1 based on certainty
- rejectionReason: if REJECT, explain why

STRICT RULES:
1. If the transcript is gibberish, random unrelated words, or clearly not about baby care, set type to REJECT and confidence to 0.1
2. If the transcript is a clear baby activity with specific details (amount, time), set confidence to 0.8-1.0
3. If the transcript is a valid baby note without specific details, set type to NOTE and confidence to 0.6-0.8
4. Only use REJECT for truly nonsensical input like "xyz abc 123", "blah blah", "what's the weather"`,
          },
          { role: 'user', content: transcript },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'baby_log',
            schema: logSchema,
          },
        },
      })

      const parsed = JSON.parse(response.output_text)

      console.log('OpenAI parsed result:', JSON.stringify(parsed))

      return {
        type: parsed.type || 'NOTE',
        startTime: new Date().toISOString(),
        amount: parsed.amount,
        unit: parsed.unit,
        notes: parsed.notes,
        confidence: parsed.confidence || 0.5,
      }
    } catch (error) {
      console.error('OpenAI parsing error:', error)
      return {
        type: 'NOTE',
        startTime: new Date().toISOString(),
        confidence: 0.1,
        notes: transcript,
      }
    }
  }
}

const insightsSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    patterns: { type: 'array', items: { type: 'string' } },
    suggestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'patterns', 'suggestions'],
  additionalProperties: false,
}

export class OpenAIInsightGenerator implements IInsightGenerator {
  async generate(babyName: string, logs: LogEntry[]): Promise<WeeklyInsights> {
    const logSummary = logs
      .map(
        (log) =>
          `- ${log.type} at ${log.startTime.toISOString()}${log.amount ? `, ${log.amount}${log.unit || ''}` : ''}${log.notes ? `: ${log.notes}` : ''}`
      )
      .join('\n')

    try {
      const response = await getOpenAIClient().responses.create({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'system',
            content: 'You are a pediatric advice assistant. Analyze the baby logs and provide practical insights.',
          },
          { role: 'user', content: `Baby: ${babyName}\n\nLogs:\n${logSummary}` },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'weekly_insights',
            schema: insightsSchema,
          },
        },
      })

      return JSON.parse(response.output_text)
    } catch (error) {
      console.error('OpenAI insights error:', error)
      return {
        summary: 'Unable to generate insights at this time.',
        patterns: [],
        suggestions: [],
      }
    }
  }
}
