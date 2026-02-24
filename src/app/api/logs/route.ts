// Logs API Route - Thin controller following SOC
// Responsibility: HTTP request/response handling only

import { NextRequest, NextResponse } from 'next/server'
import { LogService } from '@/services/log.service'
import { CreateLogDto } from '@/types'

const logService = new LogService()

export async function GET(request: NextRequest) {
  try {
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
    const body: CreateLogDto = await request.json()

    if (!body.babyId || !body.type || !body.startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: babyId, type, startTime' },
        { status: 400 }
      )
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
