import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    return NextResponse.json({ user })
  } catch (err) {
    return serverError('auth/me', err)
  }
}

/** Update the signed-in user's lightweight profile fields. */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req)
    if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : undefined
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined
    const address = typeof body.address === 'string' ? body.address.trim() : undefined
    const city = typeof body.city === 'string' ? body.city.trim() : undefined

    const updated = await db.user.update({
      where: { id: session.id },
      data: { ...(name && { name }), ...(phone !== undefined && { phone }), ...(address !== undefined && { address }), ...(city !== undefined && { city }) },
      select: { id: true, email: true, name: true, role: true, phone: true, address: true, city: true },
    })

    return NextResponse.json({ user: updated })
  } catch (err) {
    return serverError('auth/me PATCH', err)
  }
}
