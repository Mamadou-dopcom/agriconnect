import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, rating, comment } = body

    if (!orderId || !rating) {
      return NextResponse.json({ error: 'Commande et note requis' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Note invalide (1-5)' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true, buyer: true, farmer: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    if (order.buyerId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Vous ne pouvez noter que les commandes livrées' }, { status: 400 })
    }

    if (order.review) {
      return NextResponse.json({ error: 'Vous avez déjà noté cette commande' }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        orderId,
        reviewerId: session.user.id,
        reviewedId: order.farmerId,
        rating,
        comment: comment?.trim() || null
      }
    })

    const farmerReviews = await prisma.review.aggregate({
      where: { reviewedId: order.farmerId },
      _avg: { rating: true },
      _count: { id: true }
    })

    await prisma.farmerProfile.update({
      where: { userId: order.farmerId },
      data: {
        rating: farmerReviews._avg.rating || 0,
        ratingCount: farmerReviews._count.id
      }
    })

    return NextResponse.json({ message: 'Avis enregistré', review }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')
    const productId = searchParams.get('productId')

    const where = {}
    if (farmerId) where.reviewedId = farmerId
    
    if (productId) {
      where.order = {
        items: {
          some: { productId }
        }
      }
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: { select: { fullName: true } },
        order: { 
          select: { 
            items: {
              select: { productId: true, productName: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json(reviews)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
