import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { EMAIL_RE, readBody, serverError, trimStr } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** POST /api/contact — store a contact message from the public form. */
export async function POST(req: NextRequest) {
  try {
    const body = await readBody(req)
    const name = trimStr(body.name)
    const email = trimStr(body.email).toLowerCase()
    const subject = trimStr(body.subject)
    const message = trimStr(body.message)

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    await db.contactMessage.create({
      data: {
        name,
        email,
        subject: subject || null,
        message,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    return serverError('contact POST', err)
  }
}
