import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

const MAX_AVATAR_DATA_URL_LENGTH = 7 * 1024 * 1024

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { avatarUrl } = body

    if (avatarUrl !== undefined) {
      const normalizedAvatar = typeof avatarUrl === 'string' ? avatarUrl.trim() : ''
      const isHttp = normalizedAvatar.startsWith('http://') || normalizedAvatar.startsWith('https://')
      const isDataImage = normalizedAvatar.startsWith('data:image/')

      if (normalizedAvatar && !isHttp && !isDataImage) {
        return NextResponse.json({ error: 'Format image invalide' }, { status: 400 })
      }

      if (isDataImage && normalizedAvatar.length > MAX_AVATAR_DATA_URL_LENGTH) {
        return NextResponse.json({ error: 'Image trop volumineuse (max 5MB)' }, { status: 400 })
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: { avatarUrl: normalizedAvatar || null }
      })

      return NextResponse.json({ success: true, avatarUrl: normalizedAvatar || null })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Avatar update error:', err)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}
