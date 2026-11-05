import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guardAdmin, serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** GET /api/admin/users — users with order count + total spent (newest first). */
export async function GET(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        city: true,
        createdAt: true,
        orders: { select: { total: true, status: true } },
      },
    })

    const list = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone,
      address: u.address,
      city: u.city,
      createdAt: u.createdAt.toISOString(),
      orderCount: u.orders.length,
      totalSpent:
        Math.round(
          u.orders
            .filter((o) => o.status !== 'CANCELLED')
            .reduce((sum, o) => sum + o.total, 0) * 100
        ) / 100,
    }))

    return NextResponse.json({ users: list })
  } catch (err) {
    return serverError('admin/users GET', err)
  }
}
