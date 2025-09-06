import bcrypt from "bcrypt"
import { prisma } from "./prisma"
import { getSession } from "./session"
import { normalizeUser, type NormalizedUser } from "./types"

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function getCurrentUser(): Promise<NormalizedUser | null> {
  const session = await getSession()
  if (!session.userId) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      displayName: true,
    },
  })

  if (!user) return null

  return normalizeUser(user)
}

export async function requireAuth(): Promise<NormalizedUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}
