import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ParsedLog {
  type: 'FEEDING' | 'SLEEP' | 'DIAPER' | 'NOTE'
  startTime: string
  endTime?: string
  amount?: number
  unit?: string
  notes?: string
  confidence: number
}

export async function parseVoiceTranscript(transcript: string): Promise<ParsedLog> {
  const systemPrompt = `You are a baby log parser. Extract structured data from voice transcripts of parents logging baby activities.

Categories:
- FEEDING: breast, bottle, formula, solid food
- SLEEP: naps, nighttime sleep
- DIAPER: wet, dirty, mixed, change
- NOTE: any other observation

Return JSON with:
{
  "type": "FEEDING|SLEEP|DIAPER|NOTE",
  "startTime": "ISO timestamp or relative like 'now', '5 minutes ago'",
  "endTime": "optional ISO timestamp",
  "amount": "numeric amount if mentioned",
  "unit": "oz, ml, minutes, hours",
  "notes": "any additional details",
  "confidence": 0-1
}

If unclear, default to NOTE type with confidence 0.5.`

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: transcript,
      },
    ],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  // Parse JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      type: 'NOTE',
      startTime: new Date().toISOString(),
      confidence: 0.1,
      notes: transcript,
    }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return {
      type: parsed.type || 'NOTE',
      startTime: parsed.startTime || new Date().toISOString(),
      endTime: parsed.endTime,
      amount: parsed.amount,
      unit: parsed.unit,
      notes: parsed.notes,
      confidence: parsed.confidence || 0.5,
    }
  } catch {
    return {
      type: 'NOTE',
      startTime: new Date().toISOString(),
      confidence: 0.1,
      notes: transcript,
    }
  }
}

export interface WeeklyInsights {
  summary: string
  patterns: string[]
  suggestions: string[]
}

export async function generateWeeklyInsights(
  babyName: string,
  logs: Array<{
    type: string
    startTime: Date
    amount?: number
    unit?: string
    notes?: string
  }>
): Promise<WeeklyInsights> {
  const logSummary = logs
    .map(
      (log) =>
        `- ${log.type} at ${log.startTime.toISOString()}${log.amount ? `, ${log.amount}${log.unit || ''}` : ''}${log.notes ? `: ${log.notes}` : ''}`
    )
    .join('\n')

  const prompt = `You are a pediatric advice assistant. Analyze this week's baby logs for ${babyName} and provide insights.

Logs:
${logSummary}

Return JSON with:
{
  "summary": "2-3 sentence summary of the week's activity",
  "patterns": ["pattern 1", "pattern 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Keep suggestions practical and evidence-based.`

  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    return {
      summary: 'Unable to generate insights at this time.',
      patterns: [],
      suggestions: [],
    }
  }

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return {
      summary: 'Unable to generate insights at this time.',
      patterns: [],
      suggestions: [],
    }
  }
}

export default anthropic
