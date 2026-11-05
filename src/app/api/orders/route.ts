import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { serializeOrder } from '@/lib/serialize'
import { EMAIL_RE, num, readBody, serverError, trimStr } from '@/lib/api'

export const dynamic = 'force-dynamic'

interface CartItemInput {
  variantId: string
  quantity: number
}

function parseItems(v: unknown): CartItemInput[] {
  if (!Array.isArray(v)) return []
  const out: CartItemInput[] = []
  for (const raw of v) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const variantId = typeof o.variantId === 'string' ? o.variantId.trim() : ''
    const qty = num(o.quantity)
    if (!variantId || qty === null || !Number.isInteger(qty) || qty < 1) continue
    out.push({ variantId, quantity: qty })
  }
  return out
}

/**
 * POST /api/orders — place a cash-on-delivery order.
 * Prices/stock always come from the DB, never from the client.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await readBody(req)
    const customerName = trimStr(body.customerName)
    const email = trimStr(body.email).toLowerCase()
    const phone = trimStr(body.phone)
    const address = trimStr(body.address)
    const city = trimStr(body.city)
    const notes = typeof body.notes === 'string' ? body.notes.trim() : ''

    if (!customerName || !email || !phone || !address || !city) {
      return NextResponse.json(
        { error: 'Name, email, phone, address and city are required' },
        { status: 400 }
      )
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const items = parseItems(body.items)
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Your cart is empty or contains invalid items' },
        { status: 400 }
      )
    }

    // Merge duplicate variant lines.
    const quantities = new Map<string, number>()
    for (const item of items) {
      quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity)
    }

    const variants = await db.productVariant.findMany({
      where: { id: { in: [...quantities.keys()] }, active: true },
      include: { product: true },
    })

    if (variants.length !== quantities.size) {
      return NextResponse.json(
        { error: 'Some items in your cart are no longer available' },
        { status: 400 }
      )
    }

    // Stock check.
    for (const v of variants) {
      const qty = quantities.get(v.id) ?? 0
      if (v.stock < qty) {
        return NextResponse.json(
          { error: `Insufficient stock for ${v.product.name} (${v.label})` },
          { status: 409 }
        )
      }
    }

    // Totals from DB prices.
    const subtotal =
      Math.round(
        variants.reduce((sum, v) => sum + v.price * (quantities.get(v.id) ?? 0), 0) * 100
      ) / 100

    const settings = await db.setting.findUnique({ where: { id: 'main' } })
    const shippingFee = settings?.shippingFee ?? 199
    const freeShippingOver = settings?.freeShippingOver ?? 4000
    const shipping = subtotal >= freeShippingOver ? 0 : shippingFee
    const total = Math.round((subtotal + shipping) * 100) / 100

    const orderNumber =
      'SUHA-' +
      Date.now().toString(36).toUpperCase() +
      (Math.random().toString(36) + 'ZZZ').slice(2, 5).toUpperCase()

    const session = await getSessionUser(req)

    try {
      const order = await db.$transaction(async (tx) => {
        // Decrement stock with a guard so concurrent orders cannot oversell.
        for (const v of variants) {
          const qty = quantities.get(v.id) ?? 0
          const res = await tx.productVariant.updateMany({
            where: { id: v.id, stock: { gte: qty } },
            data: { stock: { decrement: qty } },
          })
          if (res.count === 0) {
            throw new Error('INSUFFICIENT_STOCK')
          }
        }

        return tx.order.create({
          data: {
            orderNumber,
            userId: session?.id ?? null,
            customerName,
            email,
            phone,
            address,
            city,
            notes: notes || null,
            subtotal,
            shipping,
            total,
            status: 'PENDING',
            paymentMethod: 'COD',
            items: {
              create: variants.map((v) => ({
                variantId: v.id,
                name: v.product.name,
                size: v.size,
                price: v.price,
                quantity: quantities.get(v.id) ?? 1,
                image: v.image,
              })),
            },
          },
          include: { items: true },
        })
      })

      return NextResponse.json(
        {
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            status: order.status,
          },
        },
        { status: 201 }
      )
    } catch (txErr) {
      if (txErr instanceof Error && txErr.message === 'INSUFFICIENT_STOCK') {
        return NextResponse.json(
          { error: 'Insufficient stock for one or more items' },
          { status: 409 }
        )
      }
      throw txErr
    }
  } catch (err) {
    return serverError('orders POST', err)
  }
}

/** GET /api/orders — order history for the logged-in user (newest first). */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await db.order.findMany({
      where: { userId: session.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders: orders.map((o) => serializeOrder(o)) })
  } catch (err) {
    return serverError('orders GET', err)
  }
}
