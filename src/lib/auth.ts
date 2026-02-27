import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { jwtVerify, SignJWT } from "jose"

const authSecret = process.env.AUTH_SECRET
if (!authSecret) {
  throw new Error('AUTH_SECRET environment variable is required')
}
const JWT_SECRET = new TextEncoder().encode(authSecret)

export const { handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})

// Custom auth function that reads our JWT token
export async function auth() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
    })

    if (!user) {
      return null
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  } catch {
    return null
  }
}
