import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { bool, guardAdmin, readBody, serverError, trimStr } from '@/lib/api'

export const dynamic = 'force-dynamic'

function serialize(m: { id: string; name: string; email: string; subject: string | null; message: string; read: boolean; createdAt: Date }) {
  return { ...m, createdAt: m.createdAt.toISOString() }
}

/** GET /api/admin/messages — contact messages, newest first. */
export async function GET(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ messages: messages.map(serialize) })
  } catch (err) {
    return serverError('admin/messages GET', err)
  }
}

/** PATCH /api/admin/messages — mark a message read/unread { id, read }. */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await guardAdmin(req)
    if (guard instanceof NextResponse) return guard

    const body = await readBody(req)
    const id = trimStr(body.id)
    if (!id) {
      return NextResponse.json({ error: 'Message id is required' }, { status: 400 })
    }

    const message = await db.contactMessage.update({
      where: { id },
      data: { read: bool(body.read, true) },
    })

    return NextResponse.json({ message: serialize(message) })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }
    return serverError('admin/messages PATCH', err)
  }
}
