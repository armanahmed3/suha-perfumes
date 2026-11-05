import type {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Review,
} from '@prisma/client'

/* ------------------------------------------------------------------ */
/* JSON note-field helpers                                             */
/* ------------------------------------------------------------------ */

/**
 * Note/accord/season fields are stored as JSON strings in SQLite.
 * Parse them safely into string arrays for the frontend.
 */
export function safeParseJSON(value: string | null | undefined): string[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map((v) => (typeof v === 'string' ? v : String(v)))
    }
    return []
  } catch {
    return []
  }
}

/**
 * Accept either an already-serialized JSON string or a plain array
 * and normalize it into the JSON string format stored in the DB.
 */
export function normalizeJSONField(value: unknown): string | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'string') {
    const s = value.trim()
    return s === '' ? null : s
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value.filter((v) => typeof v === 'string' && v.trim() !== ''))
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ProductWithVariantsAndReviews = Product & {
  variants: ProductVariant[]
  reviews: Review[]
}

export type OrderWithItems = Order & { items: OrderItem[] }

export interface SerializedVariant {
  id: string
  size: string
  label: string
  price: number
  oldPrice: number | null
  stock: number
  image: string | null
  sku: string | null
  active: boolean
}

export interface SerializedReview {
  id: string
  name: string
  rating: number
  comment: string
  createdAt: string
}

export interface SerializedProduct {
  id: string
  slug: string
  name: string
  category: string
  originalName: string | null
  brand: string | null
  gender: string
  year: number | null
  shortDesc: string | null
  description: string | null
  topNotes: string[]
  heartNotes: string[]
  baseNotes: string[]
  accords: string[]
  longevity: string | null
  sillage: string | null
  season: string[]
  featured: boolean
  active: boolean
  sortOrder: number
  liquidColor: string
  createdAt: string
  updatedAt: string
  variants: SerializedVariant[]
  rating: number
  reviewCount: number
  reviews?: SerializedReview[]
}

export interface SerializedOrderItem {
  id: string
  variantId: string | null
  name: string
  size: string
  price: number
  quantity: number
  image: string | null
}

export interface SerializedOrder {
  id: string
  orderNumber: string
  customerName: string
  email: string
  phone: string
  address: string
  city: string
  notes: string | null
  subtotal: number
  shipping: number
  total: number
  status: string
  paymentMethod: string
  createdAt: string
  items: SerializedOrderItem[]
  userEmail?: string | null
}

/* ------------------------------------------------------------------ */
/* Serializers                                                         */
/* ------------------------------------------------------------------ */

export function serializeVariant(v: ProductVariant): SerializedVariant {
  return {
    id: v.id,
    size: v.size,
    label: v.label,
    price: v.price,
    oldPrice: v.oldPrice,
    stock: v.stock,
    image: v.image,
    sku: v.sku,
    active: v.active,
  }
}

export function serializeReview(r: Review): SerializedReview {
  return {
    id: r.id,
    name: r.name,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  }
}

/** Average rating of approved reviews, rounded to 1 decimal + count. */
export function computeRating(reviews: Review[]): { rating: number; reviewCount: number } {
  const approved = reviews.filter((r) => r.approved)
  const reviewCount = approved.length
  if (reviewCount === 0) return { rating: 0, reviewCount: 0 }
  const sum = approved.reduce((acc, r) => acc + r.rating, 0)
  return { rating: Math.round((sum / reviewCount) * 10) / 10, reviewCount }
}

export function serializeProduct(p: ProductWithVariantsAndReviews): SerializedProduct {
  const { rating, reviewCount } = computeRating(p.reviews)
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    originalName: p.originalName,
    brand: p.brand,
    gender: p.gender,
    year: p.year,
    shortDesc: p.shortDesc,
    description: p.description,
    topNotes: safeParseJSON(p.topNotes),
    heartNotes: safeParseJSON(p.heartNotes),
    baseNotes: safeParseJSON(p.baseNotes),
    accords: safeParseJSON(p.accords),
    longevity: p.longevity,
    sillage: p.sillage,
    season: safeParseJSON(p.season),
    featured: p.featured,
    active: p.active,
    sortOrder: p.sortOrder,
    liquidColor: p.liquidColor,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    variants: p.variants.map(serializeVariant),
    rating,
    reviewCount,
  }
}

export function serializeOrder(
  o: OrderWithItems,
  userEmail?: string | null
): SerializedOrder {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    email: o.email,
    phone: o.phone,
    address: o.address,
    city: o.city,
    notes: o.notes,
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      variantId: i.variantId,
      name: i.name,
      size: i.size,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    })),
    ...(userEmail !== undefined ? { userEmail: userEmail ?? null } : {}),
  }
}
