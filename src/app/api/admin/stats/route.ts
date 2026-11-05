import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serializeOrder } from '@/lib/serialize'
import { guardAdmin, serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** GET /api/admin/stats — dashboard aggregates. */
export async function GET(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const now = new Date()
    // First day of the month 5 months back (covers the last 6 months incl. current).
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      revenueAgg,
      orderCount,
      productCount,
      userCount,
      pendingOrders,
      recentOrders,
      soldItems,
      recentMonthOrders,
    ] = await Promise.all([
      db.order.aggregate({
        _sum: { total: true },
        where: { status: { not: 'CANCELLED' } },
      }),
      db.order.count(),
      db.product.count(),
      db.user.count(),
      db.order.count({ where: { status: 'PENDING' } }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      db.orderItem.findMany({
        where: { order: { status: { not: 'CANCELLED' } } },
        select: { name: true, price: true, quantity: true },
      }),
      db.order.findMany({
        where: { status: { not: 'CANCELLED' }, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true, total: true },
      }),
    ])

    // Top 5 products by ordered quantity.
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
    for (const item of soldItems) {
      const entry = productMap.get(item.name) ?? { name: item.name, qty: 0, revenue: 0 }
      entry.qty += item.quantity
      entry.revenue += item.price * item.quantity
      productMap.set(item.name, entry)
    }
    const topProducts = [...productMap.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map((p) => ({
        name: p.name,
        qty: p.qty,
        revenue: Math.round(p.revenue * 100) / 100,
      }))

    // Monthly revenue for the last 6 months.
    const months: { key: string; label: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTH_LABELS[d.getMonth()],
        total: 0,
      })
    }
    for (const o of recentMonthOrders) {
      const key = `${o.createdAt.getFullYear()}-${o.createdAt.getMonth()}`
      const month = months.find((m) => m.key === key)
      if (month) month.total += o.total
    }
    const monthlyRevenue = months.map((m) => ({
      label: m.label,
      total: Math.round(m.total * 100) / 100,
    }))

    return NextResponse.json({
      revenue: Math.round((revenueAgg._sum.total ?? 0) * 100) / 100,
      orderCount,
      productCount,
      userCount,
      pendingOrders,
      recentOrders: recentOrders.map((o) => serializeOrder(o)),
      topProducts,
      monthlyRevenue,
    })
  } catch (err) {
    return serverError('admin/stats GET', err)
  }
}
