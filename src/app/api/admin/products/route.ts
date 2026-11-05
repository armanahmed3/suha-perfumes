import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { normalizeJSONField, serializeProduct } from '@/lib/serialize'
import {
  GENDERS,
  bool,
  guardAdmin,
  num,
  optStr,
  readBody,
  serverError,
  trimStr,
} from '@/lib/api'

export const dynamic = 'force-dynamic'

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'perfume'
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base
  let n = 1
  while (await db.product.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1
    slug = `${base}-${n}`
  }
  return slug
}

interface VariantData {
  size: string
  label: string
  price: number
  oldPrice: number | null
  stock: number
  image: string | null
  sku: string | null
  active: boolean
}

function parseNewVariant(o: Record<string, unknown>): VariantData | null {
  const label = trimStr(o.label)
  const price = num(o.price)
  if (!label || price === null || price < 0) return null
  return {
    size: trimStr(o.size) || '100ml',
    label,
    price,
    oldPrice: num(o.oldPrice),
    stock: Math.max(0, Math.round(num(o.stock) ?? 0)),
    image: optStr(o.image),
    sku: optStr(o.sku),
    active: o.active === undefined ? true : bool(o.active),
  }
}

function parseVariantList(v: unknown): VariantData[] | null {
  if (v === undefined || v === null || !Array.isArray(v)) return null
  const out: VariantData[] = []
  for (const raw of v) {
    if (!raw || typeof raw !== 'object') continue
    const parsed = parseNewVariant(raw as Record<string, unknown>)
    if (parsed) out.push(parsed)
  }
  return out
}

interface ProductPatchData {
  name?: string
  slug?: string
  category?: string
  originalName?: string | null
  brand?: string | null
  gender?: string
  year?: number | null
  shortDesc?: string | null
  description?: string | null
  topNotes?: string | null
  heartNotes?: string | null
  baseNotes?: string | null
  accords?: string | null
  longevity?: string | null
  sillage?: string | null
  season?: string | null
  featured?: boolean
  active?: boolean
  liquidColor?: string
  sortOrder?: number
}

function buildProductPatch(body: Record<string, unknown>): ProductPatchData {
  const data: ProductPatchData = {}

  const name = trimStr(body.name)
  if (name) data.name = name

  const slugRaw = trimStr(body.slug)
  if (slugRaw) {
    const slug = slugify(slugRaw)
    if (slug) data.slug = slug
  }

  const category = trimStr(body.category)
  if (category) data.category = category

  if (body.originalName !== undefined) data.originalName = optStr(body.originalName)
  if (body.brand !== undefined) data.brand = optStr(body.brand)

  const gender = trimStr(body.gender)
  if ((GENDERS as readonly string[]).includes(gender)) data.gender = gender

  if (body.year !== undefined) data.year = num(body.year)
  if (body.shortDesc !== undefined) data.shortDesc = optStr(body.shortDesc)
  if (body.description !== undefined) data.description = optStr(body.description)
  if (body.topNotes !== undefined) data.topNotes = normalizeJSONField(body.topNotes)
  if (body.heartNotes !== undefined) data.heartNotes = normalizeJSONField(body.heartNotes)
  if (body.baseNotes !== undefined) data.baseNotes = normalizeJSONField(body.baseNotes)
  if (body.accords !== undefined) data.accords = normalizeJSONField(body.accords)
  if (body.longevity !== undefined) data.longevity = optStr(body.longevity)
  if (body.sillage !== undefined) data.sillage = optStr(body.sillage)
  if (body.season !== undefined) data.season = normalizeJSONField(body.season)
  if (body.featured !== undefined) data.featured = bool(body.featured)
  if (body.active !== undefined) data.active = bool(body.active)

  const liquidColor = optStr(body.liquidColor)
  if (liquidColor) data.liquidColor = liquidColor

  const sortOrder = num(body.sortOrder)
  if (sortOrder !== null) data.sortOrder = Math.round(sortOrder)

  return data
}

const productInclude = {
  variants: { orderBy: { price: 'asc' as const } },
  reviews: { where: { approved: true } },
}

/** GET /api/admin/products — every product (incl. inactive) with variants + rating. */
export async function GET(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const products = await db.product.findMany({
      include: productInclude,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ products: products.map(serializeProduct) })
  } catch (err) {
    return serverError('admin/products GET', err)
  }
}

/** POST /api/admin/products — create a product with nested variants. */
export async function POST(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const body = await readBody(req)
    const name = trimStr(body.name)
    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    const slug = await uniqueSlug(slugify(trimStr(body.slug)) || slugify(name))
    const variants = parseVariantList(body.variants) ?? []
    const gender = trimStr(body.gender)

    const product = await db.product.create({
      data: {
        name,
        slug,
        category: trimStr(body.category) || 'Impression',
        originalName: optStr(body.originalName),
        brand: optStr(body.brand),
        gender: (GENDERS as readonly string[]).includes(gender) ? gender : 'Unisex',
        year: num(body.year),
        shortDesc: optStr(body.shortDesc),
        description: optStr(body.description),
        topNotes: normalizeJSONField(body.topNotes),
        heartNotes: normalizeJSONField(body.heartNotes),
        baseNotes: normalizeJSONField(body.baseNotes),
        accords: normalizeJSONField(body.accords),
        longevity: optStr(body.longevity),
        sillage: optStr(body.sillage),
        season: normalizeJSONField(body.season),
        featured: bool(body.featured),
        active: body.active === undefined ? true : bool(body.active),
        liquidColor: optStr(body.liquidColor) ?? '#D4AF37',
        sortOrder: Math.round(num(body.sortOrder) ?? 0),
        variants: variants.length > 0 ? { create: variants } : undefined,
      },
      include: productInclude,
    })

    return NextResponse.json({ product: serializeProduct(product) }, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 409 }
      )
    }
    return serverError('admin/products POST', err)
  }
}

/** PATCH /api/admin/products — update a product; variants with id are updated, without id created. */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const body = await readBody(req)
    const id = trimStr(body.id)
    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 })
    }

    const existing = await db.product.findUnique({ where: { id }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const data = buildProductPatch(body)

    if (Array.isArray(body.variants)) {
      for (const raw of body.variants) {
        if (!raw || typeof raw !== 'object') continue
        const o = raw as Record<string, unknown>
        const variantId = typeof o.id === 'string' ? o.id.trim() : ''

        if (variantId) {
          const vd: {
            size?: string
            label?: string
            price?: number
            oldPrice?: number | null
            stock?: number
            image?: string | null
            sku?: string | null
            active?: boolean
          } = {}
          const size = trimStr(o.size)
          if (size) vd.size = size
          const label = trimStr(o.label)
          if (label) vd.label = label
          const price = num(o.price)
          if (price !== null) vd.price = price
          if (o.oldPrice !== undefined) vd.oldPrice = num(o.oldPrice)
          const stock = num(o.stock)
          if (stock !== null) vd.stock = Math.max(0, Math.round(stock))
          if (o.image !== undefined) vd.image = optStr(o.image)
          if (o.sku !== undefined) vd.sku = optStr(o.sku)
          if (o.active !== undefined) vd.active = bool(o.active)

          await db.productVariant.updateMany({
            where: { id: variantId, productId: id },
            data: vd,
          })
        } else {
          const created = parseNewVariant(o)
          if (created) {
            await db.productVariant.create({
              data: { ...created, productId: id },
            })
          }
        }
      }
    }

    const product = await db.product.update({
      where: { id },
      data,
      include: productInclude,
    })

    return NextResponse.json({ product: serializeProduct(product) })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 409 }
      )
    }
    return serverError('admin/products PATCH', err)
  }
}

/** DELETE /api/admin/products?id=... — delete a product (variants cascade). */
export async function DELETE(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Product id is required' }, { status: 400 })
    }

    await db.product.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return serverError('admin/products DELETE', err)
  }
}
