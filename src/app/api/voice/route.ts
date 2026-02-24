// Voice API Route - Thin controller following SOC
// Responsibility: HTTP request/response handling only

import { NextRequest, NextResponse } from 'next/server'
import { VoiceService } from '@/services/voice.service'
import { VoiceInputDto } from '@/types'

const voiceService = new VoiceService()

export async function POST(request: NextRequest) {
  try {
    const body: VoiceInputDto = await request.json()

    if (!body.transcript || !body.babyId) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript and babyId' },
        { status: 400 }
      )
    }

    const result = await voiceService.processVoiceInput(body)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Voice processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process voice input' },
      { status: 500 }
    )
  }
}
