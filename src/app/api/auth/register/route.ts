import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { SESSION_COOKIE, sessionCookieOptions, signToken } from '@/lib/auth'
import { EMAIL_RE, readBody, serverError, trimStr } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await readBody(req)
    const name = trimStr(body.name)
    const email = trimStr(body.email).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: { name, email, password: hashed, role: 'CUSTOMER' },
    })

    const token = await signToken({ sub: user.id, email: user.email, role: user.role })

    const res = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          address: user.address,
          city: user.city,
        },
      },
      { status: 201 }
    )
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions)
    return res
  } catch (err) {
    return serverError('auth/register', err)
  }
}
