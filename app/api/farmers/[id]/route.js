import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { id } = params

    const farmer = await prisma.user.findFirst({
      where: { id, role: 'FARMER' },
      select: {
        id: true,
        fullName: true,
        city: true,
        region: true,
        avatarUrl: true,
        createdAt: true,
        farmerProfile: {
          select: {
            farmName: true,
            farmDescription: true,
            rating: true,
            totalSales: true,
            createdAt: true
          }
        }
      }
    })

    if (!farmer) {
      return NextResponse.json({ error: 'Producteur non trouve' }, { status: 404 })
    }

    const [products, reviewCount, reviews] = await Promise.all([
      prisma.product.findMany({
        where: {
          farmerId: id,
          isAvailable: true,
          quantityAvailable: { gt: 0 }
        },
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

    const location = [farmer.city, farmer.region].filter(Boolean).join(', ')

    return NextResponse.json({
      id: farmer.id,
      fullName: farmer.fullName,
      farmName: farmer.farmerProfile?.farmName || farmer.fullName,
      location,
      bio: farmer.farmerProfile?.farmDescription || '',
      profileImage: farmer.avatarUrl || null,
      rating: farmer.farmerProfile?.rating || 0,
      totalSales: farmer.farmerProfile?.totalSales || 0,
      memberSince: farmer.farmerProfile?.createdAt || farmer.createdAt,
      reviewCount,
      products,
      recentReviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        buyerName: r.buyer.fullName,
        createdAt: r.createdAt
      }))
    })
  } catch (err) {
    console.error('Farmer fetch error:', err)
    return NextResponse.json({ error: 'Erreur lors de la recuperation du producteur' }, { status: 500 })
  }
}
