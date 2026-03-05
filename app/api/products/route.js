import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

// GET /api/products — Liste des produits
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const region = searchParams.get('region')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where = {
      isAvailable: true,
      quantityAvailable: { gt: 0 },
      ...(category && { category: { name: { contains: category, mode: 'insensitive' } } }),
      ...(region && { region: { contains: region, mode: 'insensitive' } }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          farmer: {
            select: {
              id: true, fullName: true, city: true, region: true, avatarUrl: true,
              farmerProfile: { select: { rating: true, ratingCount: true, isCertified: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/products — Créer un produit
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'FARMER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, categoryId, pricePerUnit, unit, quantityAvailable, isOrganic, region, city } = body

    if (!name || !pricePerUnit || !quantityAvailable) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        farmerId: session.user.id,
        categoryId,
        name,
        description,
        pricePerUnit: parseFloat(pricePerUnit),
        unit: unit || 'kg',
        quantityAvailable: parseFloat(quantityAvailable),
        isOrganic: isOrganic || false,
        region,
        city,
      },
      include: { category: true }
    })

    return NextResponse.json({ message: 'Produit créé !', product }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
