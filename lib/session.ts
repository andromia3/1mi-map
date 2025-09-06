import { getIronSession } from "iron-session"
import { cookies } from "next/headers"

export interface SessionData {
  userId?: string
  username?: string
  displayName?: string
}

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: "1mi-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions)
  return session
}

export async function saveSession(sessionData: SessionData) {
  const ironSession = await getIronSession<SessionData>(cookies(), sessionOptions)
  Object.assign(ironSession, sessionData)
  await ironSession.save()
}
