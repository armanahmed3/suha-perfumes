import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionUser, requireAdmin } from '@/lib/auth'
import type { SessionUser } from '@/lib/auth'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
export const GENDERS = ['Men', 'Women', 'Unisex'] as const

/* ------------------------------------------------------------------ */
/* Body parsing helpers                                                */
/* ------------------------------------------------------------------ */

/** Parse a JSON body into a plain object; returns {} on failure. */
export async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const data: unknown = await req.json()
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, unknown>
    }
    return {}
  } catch {
    return {}
  }
}

export function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export function trimStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** Trimmed string or null when empty — for optional DB fields. */
export function optStr(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? null : s
}

/** Number from a JSON number or numeric string; null when invalid. */
export function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

export function bool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v
  if (v === 'true') return true
  if (v === 'false') return false
  return fallback
}

/* ------------------------------------------------------------------ */
/* Auth guards                                                         */
/* ------------------------------------------------------------------ */

/**
 * Returns the admin SessionUser, or a NextResponse with 401 (no session)
 * / 403 (not admin) that the route should return directly.
 */
export async function guardAdmin(req: NextRequest): Promise<SessionUser | NextResponse> {
  const session = await getSessionUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = await requireAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return admin
}

/** Returns the session user, or a 401 NextResponse. */
export async function guardSession(req: NextRequest): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}

/** Uniform 500 response for unexpected errors. */
export function serverError(scope: string, err: unknown): NextResponse {
  console.error(`API error [${scope}]:`, err)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
