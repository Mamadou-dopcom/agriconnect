import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const skip = (page - 1) * limit

    const where = {
      role: 'farmer',
      farmerProfile: {
        isNot: null
      }
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { farmerProfile: { location: { contains: search, mode: 'insensitive' } } },
        { farmerProfile: { farmName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [farmers, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          },
          products: {
            where: { status: 'active' },
            select: { id: true },
            take: 0
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    const farmersWithStats = await Promise.all(
      farmers.map(async (farmer) => {
        const productCount = await prisma.product.count({
          where: { farmerId: farmer.id, status: 'active' }
        })

        const reviewCount = await prisma.review.count({
          where: { farmerId: farmer.id }
        })

        return {
          id: farmer.id,
          fullName: farmer.fullName,
          phone: farmer.phone,
          farmName: farmer.farmerProfile?.farmName || farmer.fullName,
          location: farmer.farmerProfile?.location || '',
          bio: farmer.farmerProfile?.bio || '',
          profileImage: farmer.farmerProfile?.profileImage || null,
          rating: farmer.farmerProfile?.rating || 0,
          totalSales: farmer.farmerProfile?.totalSales || 0,
          productCount,
          reviewCount,
          memberSince: farmer.farmerProfile?.createdAt
        }
      })
    )

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
    return NextResponse.json({ error: 'Erreur lors de la récupération des producteurs' }, { status: 500 })
  }
}
