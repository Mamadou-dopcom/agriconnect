import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidUUID } from '@/lib/validation'

export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const farmer = await prisma.user.findUnique({
      where: { id, role: 'farmer' },
      select: {
        id: true,
        fullName: true,
        phone: true,
        farmerProfile: {
          select: {
            farmName: true,
            location: true,
            bio: true,
            profileImage: true,
            rating: true,
            totalSales: true,
            createdAt: true
          }
        }
      }
    })

    if (!farmer) {
      return NextResponse.json({ error: 'Producteur non trouvé' }, { status: 404 })
    }

    const [products, reviewCount, reviews] = await Promise.all([
      prisma.product.findMany({
        where: { farmerId: id, status: 'active', isAvailable: true, quantityAvailable: { gt: 0 } },
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.review.count({ where: { farmerId: id } }),
      prisma.review.findMany({
        where: { farmerId: id },
        include: {
          buyer: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    return NextResponse.json({
      id: farmer.id,
      fullName: farmer.fullName,
      farmName: farmer.farmerProfile?.farmName || farmer.fullName,
      location: farmer.farmerProfile?.location || '',
      bio: farmer.farmerProfile?.bio || '',
      profileImage: farmer.farmerProfile?.profileImage || null,
      rating: farmer.farmerProfile?.rating || 0,
      totalSales: farmer.farmerProfile?.totalSales || 0,
      memberSince: farmer.farmerProfile?.createdAt,
      reviewCount,
      products,
      recentReviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        buyerName: r.buyer.fullName,
        createdAt: r.createdAt
      }))
    })
  } catch (err) {
    console.error('Farmer fetch error:', err)
    return NextResponse.json({ error: 'Erreur lors de la récupération du producteur' }, { status: 500 })
  }
}
