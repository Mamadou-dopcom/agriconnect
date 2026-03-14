import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const parsedPage = parseInt(searchParams.get('page') || '', 10)
    const parsedLimit = parseInt(searchParams.get('limit') || '', 10)
    const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1)
    const limit = Number.isNaN(parsedLimit) ? 12 : Math.min(Math.max(parsedLimit, 1), 50)
    const skip = (page - 1) * limit

    const where = {
      role: 'FARMER',
      farmerProfile: { isNot: null }
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
        { farmerProfile: { farmName: { contains: search, mode: 'insensitive' } } },
        { farmerProfile: { farmDescription: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [farmers, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    const farmerIds = farmers.map((farmer) => farmer.id)

    const [productCounts, reviewCounts] = await Promise.all([
      prisma.product.groupBy({
        by: ['farmerId'],
        where: {
          farmerId: { in: farmerIds },
          isAvailable: true,
          quantityAvailable: { gt: 0 }
        },
        _count: { _all: true }
      }),
      prisma.review.groupBy({
        by: ['reviewedId'],
        where: { reviewedId: { in: farmerIds } },
        _count: { _all: true }
      })
    ])

    const productCountByFarmer = Object.fromEntries(
      productCounts.map((item) => [item.farmerId, item._count._all])
    )
    const reviewCountByFarmer = Object.fromEntries(
      reviewCounts.map((item) => [item.reviewedId, item._count._all])
    )

    const farmersWithStats = farmers.map((farmer) => {
      const city = farmer.city || ''
      const region = farmer.region || ''
      const location = [city, region].filter(Boolean).join(', ')

      return {
        id: farmer.id,
        fullName: farmer.fullName,
        farmName: farmer.farmerProfile?.farmName || farmer.fullName,
        location,
        bio: farmer.farmerProfile?.farmDescription || '',
        profileImage: farmer.avatarUrl || null,
        rating: farmer.farmerProfile?.rating || 0,
        totalSales: farmer.farmerProfile?.totalSales || 0,
        productCount: productCountByFarmer[farmer.id] || 0,
        reviewCount: reviewCountByFarmer[farmer.id] || 0,
        memberSince: farmer.farmerProfile?.createdAt || farmer.createdAt
      }
    })

    return NextResponse.json({
      farmers: farmersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (err) {
    console.error('Farmers fetch error:', err)
    return NextResponse.json({ error: 'Erreur lors de la recuperation des producteurs' }, { status: 500 })
  }
}
