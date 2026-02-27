// Logs API Route - Thin controller following SOC
// Responsibility: HTTP request/response handling only

import { NextRequest, NextResponse } from 'next/server'
import { LogService } from '@/services/log.service'
import { BabyService } from '@/services/baby.service'
import { CreateLogDto } from '@/types'
import { auth } from '@/lib/auth'

const logService = new LogService()
const babyService = new BabyService()

async function verifyBabyAccess(babyId: string, userId: string): Promise<boolean> {
  const baby = await babyService.getBabyById(babyId, userId)
  return !!baby
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const babyId = searchParams.get('babyId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!babyId) {
      return NextResponse.json(
        { error: 'Missing required query param: babyId' },
        { status: 400 }
      )
    }

    // Verify user has access to this baby
    const hasAccess = await verifyBabyAccess(babyId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const logs = await logService.getLogsByBaby(babyId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Get logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateLogDto = await request.json()

    if (!body.babyId || !body.type || !body.startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: babyId, type, startTime' },
        { status: 400 }
      )
    }

    // Verify user has access to this baby
    const hasAccess = await verifyBabyAccess(body.babyId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const log = await logService.createLog({
      ...body,
      startTime: new Date(body.startTime),
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Create log error:', error)
    return NextResponse.json(
      { error: 'Failed to create log' },
      { status: 500 }
    )
  }
}
