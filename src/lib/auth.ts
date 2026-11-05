import { SignJWT, jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'suha-perfumes-secret-key-2024-luxury'
)

export const SESSION_COOKIE = 'suha_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days (seconds)

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  phone: string | null
  address: string | null
  city: string | null
}

export interface TokenPayload {
  sub: string
  email: string
  role: string
}

/** Sign a JWT (HS256) valid for 7 days. */
export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

/** Verify a JWT and return its payload, or null when invalid/expired. */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    if (!payload.sub) return null
    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
      role: typeof payload.role === 'string' ? payload.role : 'CUSTOMER',
    }
  } catch {
    return null
  }
}

/** Read the httpOnly session cookie, verify it and load the user from the DB. */
export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value
    if (!token) return null

    const payload = await verifyToken(token)
    if (!payload) return null

    const user = await db.user.findUnique({ where: { id: payload.sub } })
    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
    }
  } catch {
    return null
  }
}

/** Return the session user only when they are an ADMIN, otherwise null. */
export async function requireAdmin(req: NextRequest): Promise<SessionUser | null> {
  const user = await getSessionUser(req)
  if (!user || user.role !== 'ADMIN') return null
  return user
}

/** Standard cookie options for the session cookie. */
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
}
