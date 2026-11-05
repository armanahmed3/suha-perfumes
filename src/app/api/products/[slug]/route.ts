import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serializeProduct, serializeReview } from '@/lib/serialize'
import { serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** GET /api/products/[slug] — single product with variants + approved reviews. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const product = await db.product.findUnique({
      where: { slug },
      include: {
        variants: { where: { active: true }, orderBy: { price: 'asc' } },
        reviews: { where: { approved: true }, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!product || !product.active) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const serialized = serializeProduct(product)
    serialized.reviews = product.reviews.map(serializeReview)

    return NextResponse.json({ product: serialized })
  } catch (err) {
    return serverError('products/[slug] GET', err)
  }
}
