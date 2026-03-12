import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'

async function runExpiry(request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      const headerSecret = request.headers.get('x-cron-secret')
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

      if (headerSecret !== cronSecret && bearerToken !== cronSecret) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      }
    }

    const cutoffDate = new Date(Date.now() - config.pendingPaymentExpiryMinutes * 60 * 1000)

    const staleOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: { in: ['WAVE', 'ORANGE_MONEY'] },
        createdAt: { lte: cutoffDate }
      },
      include: {
        items: true,
        payment: true
      }
    })

    let cancelledCount = 0

    for (const order of staleOrders) {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: {
            id: order.id,
            status: 'PENDING',
            paymentStatus: 'PENDING'
          },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED'
          }
        })

        if (updated.count === 0) {
          return false
        }

        if (order.payment) {
          await tx.payment.updateMany({
            where: {
              orderId: order.id,
              status: 'PENDING'
            },
            data: {
              status: 'FAILED'
            }
          })
        }

        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantityAvailable: { increment: item.quantity },
              ordersCount: { decrement: 1 }
            }
          })
        }

        await tx.notification.createMany({
          data: [
            {
              userId: order.buyerId,
              title: '⌛ Paiement expiré',
              body: `La commande #${order.orderNumber} a expiré et a été annulée.`,
              type: 'order_update'
            },
            {
              userId: order.farmerId,
              title: '⌛ Commande expirée',
              body: `La commande #${order.orderNumber} a expiré et a été annulée.`,
              type: 'order_update'
            }
          ]
        })

        return true
      })

      if (result) {
        cancelledCount += 1
      }
    }

    return NextResponse.json({
      scanned: staleOrders.length,
      cancelled: cancelledCount,
      expiryMinutes: config.pendingPaymentExpiryMinutes,
    })
  } catch (err) {
    console.error('Expire pending payments error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request) {
  return runExpiry(request)
}

export async function POST(request) {
  return runExpiry(request)
}
