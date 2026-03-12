import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { isValidUUID } from '@/lib/validation'

const VALID_STATUS_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DELIVERING', 'CANCELLED'],
  DELIVERING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'Statut requis' }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id } })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const isFarmer = session.user.role === 'FARMER' && order.farmerId === session.user.id
    const isBuyer = session.user.role === 'BUYER' && order.buyerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isFarmer && !isBuyer && !isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status] || []
    
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json({ 
        error: `Impossible de passer de "${order.status}" à "${status}"` 
      }, { status: 400 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        buyer: { select: { id: true, fullName: true, phone: true } },
        farmer: { select: { id: true, fullName: true, phone: true } },
        items: true
      }
    })

    const notifyUserId = isFarmer ? order.buyerId : order.farmerId
    const statusLabels = {
      CONFIRMED: 'confirmée',
      PREPARING: 'en préparation',
      READY: 'prête',
      DELIVERING: 'en livraison',
      DELIVERED: 'livrée',
      CANCELLED: 'annulée'
    }

    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        title: `📦 Commande ${statusLabels[status] || status}`,
        body: `Votre commande #${order.orderNumber} a été ${statusLabels[status] || 'mise à jour'}`,
        type: 'order_update'
      }
    })

    return NextResponse.json({ message: 'Statut mis à jour', order: updatedOrder })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
