import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

function generateOrderNumber() {
  return `AC${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
}

const MAX_ITEMS_PER_ORDER = 50
const MAX_QUANTITY_PER_ITEM = 10000
const MIN_DELIVERY_FEE = 0
const MAX_DELIVERY_FEE = 50000

function sanitizeInput(input, maxLength = 500) {
  if (!input || typeof input !== 'string') return null
  return input.trim().slice(0, maxLength)
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100)

    const where = {
      ...(session.user.role === 'BUYER' ? { buyerId: session.user.id } : { farmerId: session.user.id }),
      ...(status && { status })
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          buyer: { select: { id: true, fullName: true, phone: true, city: true } },
          farmer: { select: { id: true, fullName: true, phone: true, city: true } },
          items: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where })
    ])

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { items, deliveryAddress, paymentMethod, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
    }

    if (items.length > MAX_ITEMS_PER_ORDER) {
      return NextResponse.json({ error: `Trop d'articles (max ${MAX_ITEMS_PER_ORDER})` }, { status: 400 })
    }

    const sanitizedDeliveryAddress = sanitizeInput(deliveryAddress, 200)
    const sanitizedNotes = sanitizeInput(notes, 500)

    if (!['WAVE', 'ORANGE_MONEY', 'CASH'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Mode de paiement invalide' }, { status: 400 })
    }

    let subtotal = 0
    let farmerId = null
    const orderItems = []

    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json({ error: 'ID produit invalide' }, { status: 400 })
      }

      const quantity = parseFloat(item.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 })
      }

      if (quantity > MAX_QUANTITY_PER_ITEM) {
        return NextResponse.json({ error: `Quantité maximale: ${MAX_QUANTITY_PER_ITEM}` }, { status: 400 })
      }

      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product || !product.isAvailable) {
        return NextResponse.json({ error: `Produit ${item.productId} non disponible` }, { status: 400 })
      }
      if (product.quantityAvailable < quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour ${product.name}` }, { status: 400 })
      }

      if (farmerId && farmerId !== product.farmerId) {
        return NextResponse.json({ error: 'Produits de différents agriculteurs non supportés' }, { status: 400 })
      }
      farmerId = product.farmerId

      const total = product.pricePerUnit * quantity
      subtotal += total
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity,
        unit: product.unit,
        unitPrice: product.pricePerUnit,
        totalPrice: total,
        productQuantity: quantity,
      })
    }

    const deliveryFee = 700
    if (deliveryFee < MIN_DELIVERY_FEE || deliveryFee > MAX_DELIVERY_FEE) {
      return NextResponse.json({ error: 'Frais de livraison invalides' }, { status: 400 })
    }
    
    const commission = Math.round(subtotal * 0.10)
    const totalAmount = subtotal + deliveryFee + commission

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          buyerId: session.user.id,
          farmerId,
          deliveryAddress: sanitizedDeliveryAddress,
          subtotal,
          deliveryFee,
          platformCommission: commission,
          totalAmount,
          paymentMethod,
          notes: sanitizedNotes,
          items: { create: orderItems }
        },
        include: { items: true, buyer: true, farmer: true }
      })

      for (const orderItem of orderItems) {
        await tx.product.update({
          where: { id: orderItem.productId },
          data: {
            quantityAvailable: { decrement: orderItem.productQuantity },
            ordersCount: { increment: 1 }
          }
        })
      }

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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
