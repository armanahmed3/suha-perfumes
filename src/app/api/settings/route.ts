import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serverError } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** GET /api/settings — public storefront settings (creates defaults if missing). */
export async function GET() {
  try {
    let settings = await db.setting.findUnique({ where: { id: 'main' } })
    if (!settings) {
      settings = await db.setting.create({ data: { id: 'main' } })
    }
    return NextResponse.json({ settings })
  } catch (err) {
    return serverError('settings GET', err)
  }
}
