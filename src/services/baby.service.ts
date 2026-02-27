import { prisma } from '@/lib/prisma'
import { Baby, CreateBabyDto } from '@/types'

export class BabyService {
  async getBabiesByUserId(userId: string): Promise<Baby[]> {
    const userBabies = await prisma.userBaby.findMany({
      where: { userId },
      include: { baby: true },
    })
    return userBabies.map(ub => ub.baby)
  }

  async getBabyById(babyId: string, userId: string): Promise<Baby | null> {
    const userBaby = await prisma.userBaby.findUnique({
      where: {
        userId_babyId: {
          userId,
          babyId,
        },
      },
      include: { baby: true },
    })
    return userBaby?.baby || null
  }

  async createBaby(userId: string, data: CreateBabyDto): Promise<Baby> {
    const baby = await prisma.baby.create({
      data: {
        name: data.name,
        birthDate: data.birthDate,
        users: {
          create: {
            userId,
          },
        },
      },
    })
    return baby
  }

  async updateBaby(babyId: string, userId: string, data: Partial<CreateBabyDto>): Promise<Baby | null> {
    // First verify user has access to this baby
    const userBaby = await prisma.userBaby.findUnique({
      where: {
        userId_babyId: {
          userId,
          babyId,
        },
      },
    })

    if (!userBaby) {
      return null
    }

    return prisma.baby.update({
      where: { id: babyId },
      data: {
        name: data.name,
        birthDate: data.birthDate,
      },
    })
  }

  async deleteBaby(babyId: string, userId: string): Promise<boolean> {
    const userBaby = await prisma.userBaby.findUnique({
      where: {
        userId_babyId: {
          userId,
          babyId,
        },
      },
    })

    if (!userBaby) {
      return false
    }

    // Delete the userBaby relation (cascades to delete baby and logs)
    await prisma.userBaby.delete({
      where: { id: userBaby.id },
    })

    return true
  }
}

export const babyService = new BabyService()
