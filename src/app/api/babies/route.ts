import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { babyService } from '@/services/baby.service'
import { CreateBabyDto } from '@/types'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const babies = await babyService.getBabiesByUserId(session.user.id)
    return NextResponse.json(babies)
  } catch (error) {
    console.error('Failed to fetch babies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateBabyDto = await request.json()

    if (!body.name || !body.birthDate) {
      return NextResponse.json({ error: 'Name and birth date are required' }, { status: 400 })
    }

    const baby = await babyService.createBaby(session.user.id, {
      name: body.name,
      birthDate: new Date(body.birthDate),
    })

    return NextResponse.json(baby, { status: 201 })
  } catch (error) {
    console.error('Failed to create baby:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
