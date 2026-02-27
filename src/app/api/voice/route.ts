// Voice API Route - Thin controller following SOC
// Responsibility: HTTP request/response handling only

import { NextRequest, NextResponse } from 'next/server'
import { VoiceService } from '@/services/voice.service'
import { BabyService } from '@/services/baby.service'
import { VoiceInputDto } from '@/types'
import { auth } from '@/lib/auth'

const voiceService = new VoiceService()
const babyService = new BabyService()

async function verifyBabyAccess(babyId: string, userId: string): Promise<boolean> {
  const baby = await babyService.getBabyById(babyId, userId)
  return !!baby
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: VoiceInputDto = await request.json()

    if (!body.transcript || !body.babyId) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript and babyId' },
        { status: 400 }
      )
    }

    // Verify user has access to this baby
    const hasAccess = await verifyBabyAccess(body.babyId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await voiceService.processVoiceInput(body)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Voice processing error:', error)

    // Handle specific errors
    if (error instanceof Error && error.message === 'UNRECOGNIZED_ACTIVITY') {
      return NextResponse.json(
        { error: 'UNRECOGNIZED_ACTIVITY: Could not recognize this as a baby activity. Try saying things like "Baby ate 4 oz" or "Baby slept for 2 hours".' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process voice input' },
      { status: 500 }
    )
  }
}
