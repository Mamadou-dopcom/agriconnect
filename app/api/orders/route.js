import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { config } from '@/lib/config'
import {
  initiateOrangeMoneyPayment,
  initiateWavePayment,
  validatePhoneForPayment,
} from '@/lib/payments'

function generateOrderNumber() {
  return `AC${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
}

const MAX_ITEMS_PER_ORDER = 50
const MAX_QUANTITY_PER_ITEM = 10000

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

    const buyer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, phone: true }
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const requiresOnlinePayment = paymentMethod === 'WAVE' || paymentMethod === 'ORANGE_MONEY'
    const provider = paymentMethod === 'WAVE' ? 'wave' : paymentMethod === 'ORANGE_MONEY' ? 'orange' : null

    if (provider === 'orange' && !validatePhoneForPayment(buyer.phone, 'orange')) {
      return NextResponse.json({ error: 'Numéro invalide pour Orange Money' }, { status: 400 })
    }

    const deliveryFee = config.deliveryFee
    if (deliveryFee < config.minDeliveryFee || deliveryFee > config.maxDeliveryFee) {
      return NextResponse.json({ error: 'Frais de livraison invalides' }, { status: 400 })
    }

    const normalizedItems = items.map((item) => ({
      productId: item?.productId,
      quantity: parseFloat(item?.quantity)
    }))

    for (const item of normalizedItems) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json({ error: 'ID produit invalide' }, { status: 400 })
      }
      if (isNaN(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 })
      }
      if (item.quantity > MAX_QUANTITY_PER_ITEM) {
        return NextResponse.json({ error: `Quantité maximale: ${MAX_QUANTITY_PER_ITEM}` }, { status: 400 })
      }
    }

    const mergedByProductId = new Map()
    for (const item of normalizedItems) {
      const current = mergedByProductId.get(item.productId) || 0
      mergedByProductId.set(item.productId, current + item.quantity)
    }

    const productIds = Array.from(mergedByProductId.keys())
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isAvailable: true,
      }
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'Un ou plusieurs produits sont non disponibles' }, { status: 400 })
    }

    const productsById = new Map(products.map((product) => [product.id, product]))
    const groupsByFarmer = new Map()

    for (const [productId, quantity] of mergedByProductId.entries()) {
      const product = productsById.get(productId)
      if (!product) {
        return NextResponse.json({ error: `Produit ${productId} non disponible` }, { status: 400 })
      }
      if (product.quantityAvailable < quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour ${product.name}` }, { status: 400 })
      }

      const farmerId = product.farmerId
      if (!groupsByFarmer.has(farmerId)) {
        groupsByFarmer.set(farmerId, {
          farmerId,
          subtotal: 0,
          orderItems: [],
          productIds: []
        })
      }

      const group = groupsByFarmer.get(farmerId)
      const total = product.pricePerUnit * quantity
      group.subtotal += total
      group.productIds.push(product.id)
      group.orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity,
        unit: product.unit,
        unitPrice: product.pricePerUnit,
        totalPrice: total,
        productQuantity: quantity,
      })
    }

    const groupedOrders = Array.from(groupsByFarmer.values())

    if (requiresOnlinePayment && groupedOrders.length > 1) {
      return NextResponse.json({
        error: 'Le paiement en ligne multi-producteurs n\'est pas encore disponible. Choisissez le paiement en espèces.'
      }, { status: 400 })
    }

    const createdOrders = await prisma.$transaction(async (tx) => {
      const created = []

      for (const group of groupedOrders) {
        const commission = Math.round(group.subtotal * (config.platformCommissionPercent / 100))
        const totalAmount = group.subtotal + deliveryFee + commission

        const newOrder = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            buyerId: session.user.id,
            farmerId: group.farmerId,
            deliveryAddress: sanitizedDeliveryAddress,
            subtotal: group.subtotal,
            deliveryFee,
            platformCommission: commission,
            totalAmount,
            paymentMethod,
            notes: sanitizedNotes,
            items: { create: group.orderItems }
          },
          include: { items: true, buyer: true, farmer: true }
        })

        for (const orderItem of group.orderItems) {
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
            userId: group.farmerId,
            title: '🛒 Nouvelle commande !',
            body: `Commande #${newOrder.orderNumber} — ${totalAmount.toLocaleString()} FCFA`,
            type: 'new_order',
          }
        })

        created.push({
          order: newOrder,
          orderItems: group.orderItems,
          totalAmount,
        })
      }

      await tx.cartItem.deleteMany({
        where: {
          userId: session.user.id,
          productId: { in: productIds }
        }
      })

      return created
    })

    let paymentPayload = null

    if (requiresOnlinePayment) {
      const { order, orderItems, totalAmount } = createdOrders[0]

      const paymentMetadata = {
        provider,
        orderId: order.id,
        orderNumber: order.orderNumber,
        buyerId: order.buyerId,
        farmerId: order.farmerId,
      }

      const initResult = provider === 'wave'
        ? await initiateWavePayment(totalAmount, 'XOF', paymentMetadata)
        : await initiateOrangeMoneyPayment(totalAmount, buyer.phone, paymentMetadata)

      if (initResult.error) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.create({
            data: {
              orderId: order.id,
              amount: totalAmount,
              currency: 'XOF',
              method: paymentMethod,
              status: 'FAILED',
            }
          })

          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'FAILED',
              status: 'CANCELLED'
            }
          })

          for (const orderItem of orderItems) {
            await tx.product.update({
              where: { id: orderItem.productId },
              data: {
                quantityAvailable: { increment: orderItem.productQuantity },
                ordersCount: { decrement: 1 }
              }
            })
          }

          await tx.notification.create({
            data: {
              userId: order.farmerId,
              title: '❌ Paiement échoué',
              body: `La commande #${order.orderNumber} a été annulée (échec du paiement).`,
              type: 'order_update',
            }
          })
        })

        return NextResponse.json({ error: initResult.error }, { status: 502 })
      }

      const providerReference = initResult.reference || null

      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          currency: 'XOF',
          method: paymentMethod,
          status: 'PENDING',
          providerReference,
        }
      })

      if (providerReference) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentReference: providerReference }
        })
      }

      paymentPayload = {
        provider,
        reference: providerReference,
        checkoutUrl: initResult.checkoutUrl || null,
        status: 'PENDING'
      }
    }

    const orders = createdOrders.map((entry) => entry.order)
    return NextResponse.json({
      message: orders.length > 1 ? `${orders.length} commandes créées !` : 'Commande créée !',
      orders,
      order: orders[0],
      payment: paymentPayload
    }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
