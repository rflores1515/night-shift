// Anthropic Implementation

import Anthropic from '@anthropic-ai/sdk'
import { ParsedLog, WeeklyInsights } from '@/types'
import { ITranscriptParser, IInsightGenerator, LogEntry } from './parser'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export class AnthropicTranscriptParser implements ITranscriptParser {
  async parse(transcript: string): Promise<ParsedLog> {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: `You are a baby log parser. Extract JSON with:
- type: FEEDING, SLEEP, DIAPER, or NOTE
- amount: numeric value if mentioned
- unit: oz, ml, minutes, hours
- notes: additional details
- confidence: 0-1`,
        messages: [{ role: 'user', content: transcript }],
      })

      const textContent = message.content.find((c): c is Anthropic.TextBlock => c.type === 'text')
      const responseText = textContent?.text || ''
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        return {
          type: 'NOTE',
          startTime: new Date().toISOString(),
          confidence: 0.1,
          notes: transcript,
        }
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Map type to our enum
      let type: 'FEEDING' | 'SLEEP' | 'DIAPER' | 'NOTE' = 'NOTE'
      const typeValue = parsed.type?.toLowerCase() || ''

      if (
        typeValue.includes('feed') ||
        typeValue.includes('formula') ||
        typeValue.includes('bottle') ||
        typeValue.includes('nurse') ||
        typeValue.includes('breast') ||
        typeValue.includes('solid')
      ) {
        type = 'FEEDING'
      } else if (typeValue.includes('sleep') || typeValue.includes('nap') || typeValue.includes('bed')) {
        type = 'SLEEP'
      } else if (
        typeValue.includes('diaper') ||
        typeValue.includes('wet') ||
        typeValue.includes('dirty') ||
        typeValue.includes('poop')
      ) {
        type = 'DIAPER'
      }

      return {
        type,
        startTime: parsed.startTime || new Date().toISOString(),
        amount: parsed.amount,
        unit: parsed.unit,
        notes: parsed.notes,
        confidence: parsed.confidence || 0.5,
      }
    } catch (error) {
      console.error('Anthropic parsing error:', error)
      return {
        type: 'NOTE',
        startTime: new Date().toISOString(),
        confidence: 0.1,
        notes: transcript,
      }
    }
  }
}

export class AnthropicInsightGenerator implements IInsightGenerator {
  async generate(babyName: string, logs: LogEntry[]): Promise<WeeklyInsights> {
    const logSummary = logs
      .map(
        (log) =>
          `- ${log.type} at ${log.startTime.toISOString()}${log.amount ? `, ${log.amount}${log.unit || ''}` : ''}${log.notes ? `: ${log.notes}` : ''}`
      )
      .join('\n')

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze this week's baby logs for ${babyName} and return JSON with:
{
  "summary": "2-3 sentence summary",
  "patterns": ["pattern 1"],
  "suggestions": ["suggestion 1"]
}

Logs:
${logSummary}`,
          },
        ],
      })

      const textContent = message.content.find((c): c is Anthropic.TextBlock => c.type === 'text')
      const responseText = textContent?.text || ''
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        return {
          summary: 'Unable to generate insights at this time.',
          patterns: [],
          suggestions: [],
        }
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Anthropic insights error:', error)
      return {
        summary: 'Unable to generate insights at this time.',
        patterns: [],
        suggestions: [],
      }
    }
  }
}
