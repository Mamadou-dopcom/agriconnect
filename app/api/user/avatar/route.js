import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/validation'

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { avatarUrl } = body

    if (avatarUrl !== undefined) {
      const sanitizedUrl = sanitizeInput(avatarUrl)
      if (sanitizedUrl && !sanitizedUrl.startsWith('http')) {
        return NextResponse.json({ error: 'URL invalide' }, { status: 400 })
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { avatarUrl: sanitizedUrl || null }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Avatar update error:', err)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}
