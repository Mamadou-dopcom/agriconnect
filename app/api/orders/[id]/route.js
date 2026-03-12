import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { isValidUUID } from '@/lib/validation'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { id, OR: [{ buyerId: session.user.id }, { farmerId: session.user.id }] },
      include: {
        buyer: { select: { id: true, fullName: true, phone: true, city: true } },
        farmer: { select: { id: true, fullName: true, phone: true, city: true } },
        items: true,
        review: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const isBuyer = session.user.role === 'BUYER' && order.buyerId === session.user.id
    const isFarmer = session.user.role === 'FARMER' && order.farmerId === session.user.id

    if (!isBuyer && !isFarmer) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return NextResponse.json({ 
        error: 'Impossible d\'annuler cette commande' 
      }, { status: 400 })
    }

    const cancelledOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' }
      })

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantityAvailable: { increment: item.quantity },
            ordersCount: { decrement: 1 }
          }
        })
      }

      return updated
    })

    const notifyUserId = isBuyer ? order.farmerId : order.buyerId
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        title: '📦 Commande annulée',
        body: `La commande #${order.orderNumber} a été annulée`,
        type: 'order_update'
      }
    })

    return NextResponse.json({ message: 'Commande annulée', order: cancelledOrder })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
