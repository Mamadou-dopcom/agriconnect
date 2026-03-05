import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

function generateOrderNumber() {
  return `AC${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
}

// GET /api/orders — Mes commandes
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where = {
      ...(session.user.role === 'BUYER' ? { buyerId: session.user.id } : { farmerId: session.user.id }),
      ...(status && { status })
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: { select: { id: true, fullName: true, phone: true, city: true } },
        farmer: { select: { id: true, fullName: true, phone: true, city: true } },
        items: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/orders — Créer une commande
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { items, deliveryAddress, paymentMethod, notes } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
    }

    // Vérifier les produits et calculer le total
    let subtotal = 0
    let farmerId = null
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product || !product.isAvailable) {
        return NextResponse.json({ error: `Produit ${item.productId} non disponible` }, { status: 400 })
      }
      if (product.quantityAvailable < item.quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour ${product.name}` }, { status: 400 })
      }

      if (farmerId && farmerId !== product.farmerId) {
        return NextResponse.json({ error: 'Produits de différents agriculteurs non supportés' }, { status: 400 })
      }
      farmerId = product.farmerId

      const total = product.pricePerUnit * item.quantity
      subtotal += total
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unit: product.unit,
        unitPrice: product.pricePerUnit,
        totalPrice: total,
      })
    }

    const deliveryFee = 700
    const commission = Math.round(subtotal * 0.10)
    const totalAmount = subtotal + deliveryFee + commission

    // Créer commande + articles + notifications en transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          buyerId: session.user.id,
          farmerId,
          deliveryAddress,
          subtotal,
          deliveryFee,
          platformCommission: commission,
          totalAmount,
          paymentMethod,
          notes,
          items: { create: orderItems }
        },
        include: { items: true, buyer: true, farmer: true }
      })

      // Réduire les stocks
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantityAvailable: { decrement: item.quantity },
            ordersCount: { increment: 1 }
          }
        })
      }

      // Notification agriculteur
      await tx.notification.create({
        data: {
          userId: farmerId,
          title: '🛒 Nouvelle commande !',
          body: `Commande #${newOrder.orderNumber} — ${totalAmount.toLocaleString()} FCFA`,
          type: 'new_order',
        }
      })

      return newOrder
    })

    return NextResponse.json({ message: 'Commande créée !', order }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 })
  }
}
