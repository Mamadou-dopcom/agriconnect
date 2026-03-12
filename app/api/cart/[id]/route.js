import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = params

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!cartItem) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    await prisma.cartItem.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Article supprimé' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = params
    const { quantity } = await request.json()

    if (typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 })
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId: session.user.id },
      include: { product: true }
    })

    if (!cartItem) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 })
    }

    if (quantity > cartItem.product.quantityAvailable) {
      return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 })
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity }
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
