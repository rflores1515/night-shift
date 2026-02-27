import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Resend from "next-auth/providers/resend"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: process.env.EMAIL_FROM || "noreply@night-shift.local",
      apiKey: process.env.RESEND_API_KEY,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      // Add user id to session
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
  session: {
    strategy: "database",
  },
})
