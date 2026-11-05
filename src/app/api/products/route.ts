import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { serializeProduct } from '@/lib/serialize'
import { serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products
 * Query params: search, gender (Men|Women|Unisex|All), featured ('1'),
 *               sort (name | price_asc | price_desc | newest)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = (searchParams.get('search') ?? '').trim()
    const gender = searchParams.get('gender') ?? 'All'
    const featured = searchParams.get('featured') === '1'
    const sort = searchParams.get('sort') ?? 'default'

    const where: Prisma.ProductWhereInput = { active: true }
    if (featured) where.featured = true
    if (gender === 'Men' || gender === 'Women' || gender === 'Unisex') {
      where.gender = gender
    }
    if (search) {
      // SQLite LIKE is case-insensitive for ASCII, so plain `contains` is enough.
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { originalName: { contains: search } },
      ]
    }

    const products = await db.product.findMany({
      where,
      include: {
        variants: { where: { active: true }, orderBy: { price: 'asc' } },
        reviews: { where: { approved: true } },
      },
    })

    const withPrice = products.map((p) => ({
      p,
      price: p.variants.length > 0 ? Math.min(...p.variants.map((v) => v.price)) : 0,
    }))

    let sorted = [...withPrice]
    switch (sort) {
      case 'name':
        sorted.sort((a, b) => a.p.name.localeCompare(b.p.name))
        break
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        sorted.sort((a, b) => b.p.createdAt.getTime() - a.p.createdAt.getTime())
        break
      default:
        sorted.sort(
          (a, b) => a.p.sortOrder - b.p.sortOrder || a.p.name.localeCompare(b.p.name)
        )
        break
    }

    return NextResponse.json({ products: sorted.map((x) => serializeProduct(x.p)) })
  } catch (err) {
    return serverError('products GET', err)
  }
}
