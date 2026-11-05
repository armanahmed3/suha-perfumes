import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { serializeOrder } from '@/lib/serialize'
import { ORDER_STATUSES, guardAdmin, readBody, serverError, trimStr } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** GET /api/admin/orders?status=PENDING — all orders, newest first. */
export async function GET(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? ''

    const where: Prisma.OrderWhereInput = {}
    if ((ORDER_STATUSES as readonly string[]).includes(status)) {
      where.status = status
    }

    const orders = await db.order.findMany({
      where,
      include: { items: true, user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      orders: orders.map((o) => serializeOrder(o, o.user?.email ?? null)),
    })
  } catch (err) {
    return serverError('admin/orders GET', err)
  }
}

/** PATCH /api/admin/orders — update order status { id, status }. */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const body = await readBody(req)
    const id = trimStr(body.id)
    const status = trimStr(body.status)

    if (!id) {
      return NextResponse.json({ error: 'Order id is required' }, { status: 400 })
    }
    if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
      include: { items: true, user: { select: { email: true } } },
    })

    return NextResponse.json({ order: serializeOrder(order, order.user?.email ?? null) })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return serverError('admin/orders PATCH', err)
  }
}
