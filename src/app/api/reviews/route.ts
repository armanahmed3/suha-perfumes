import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { serializeReview } from '@/lib/serialize'
import { num, readBody, serverError, trimStr } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** POST /api/reviews — create an approved review for a product (auth optional). */
export async function POST(req: NextRequest) {
  try {
    const body = await readBody(req)
    const slug = trimStr(body.slug)
    const name = trimStr(body.name)
    const comment = trimStr(body.comment)
    const rating = num(body.rating)

    if (!slug) {
      return NextResponse.json({ error: 'Product is required' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (rating === null || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }
    if (!comment) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 })
    }

    const product = await db.product.findUnique({ where: { slug } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const session = await getSessionUser(req)

    const review = await db.review.create({
      data: {
        productId: product.id,
        userId: session?.id ?? null,
        name,
        rating,
        comment,
        approved: true,
      },
    })

    return NextResponse.json({ review: serializeReview(review) }, { status: 201 })
  } catch (err) {
    return serverError('reviews POST', err)
  }
}
