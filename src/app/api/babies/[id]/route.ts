import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { babyService } from '@/services/baby.service'
import { CreateBabyDto } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: babyId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const baby = await babyService.getBabyById(babyId, session.user.id)

    if (!baby) {
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 })
    }

    return NextResponse.json(baby)
  } catch (error) {
    console.error('Failed to fetch baby:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: babyId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: Partial<CreateBabyDto> = await request.json()

    const baby = await babyService.updateBaby(babyId, session.user.id, body)

    if (!baby) {
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 })
    }

    return NextResponse.json(baby)
  } catch (error) {
    console.error('Failed to update baby:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: babyId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await babyService.deleteBaby(babyId, session.user.id)

    if (!success) {
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete baby:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
