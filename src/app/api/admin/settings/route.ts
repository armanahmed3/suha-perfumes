import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guardAdmin, num, readBody, serverError, trimStr } from '@/lib/api'

export const dynamic = 'force-dynamic'

interface SettingsPatch {
  phone?: string
  email?: string
  instagram?: string
  facebook?: string
  address?: string
  shippingFee?: number
  freeShippingOver?: number
  announcement?: string
}

/** PUT /api/admin/settings — update storefront settings. */
export async function PUT(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const body = await readBody(req)
    const data: SettingsPatch = {}

    const phone = trimStr(body.phone)
    if (phone) data.phone = phone

    const email = trimStr(body.email)
    if (email) data.email = email

    const instagram = trimStr(body.instagram)
    if (instagram) data.instagram = instagram

    const facebook = trimStr(body.facebook)
    if (facebook) data.facebook = facebook

    const address = trimStr(body.address)
    if (address) data.address = address

    const shippingFee = num(body.shippingFee)
    if (shippingFee !== null) data.shippingFee = shippingFee

    const freeShippingOver = num(body.freeShippingOver)
    if (freeShippingOver !== null) data.freeShippingOver = freeShippingOver

    if (typeof body.announcement === 'string') {
      data.announcement = body.announcement.trim()
    }

    const settings = await db.setting.upsert({
      where: { id: 'main' },
      update: data,
      create: { id: 'main', ...data },
    })

    return NextResponse.json({ settings })
  } catch (err) {
    return serverError('admin/settings PUT', err)
  }
}
