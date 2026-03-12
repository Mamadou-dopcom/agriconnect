import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const MAX_PRICE = 1000000
const MAX_QUANTITY = 100000
const MAX_NAME_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000

function sanitizeInput(input, maxLength = 500) {
  if (!input || typeof input !== 'string') return null
  return input.trim().slice(0, maxLength)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const region = searchParams.get('region')
    const search = searchParams.get('search')
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          farmer: {
            select: {
              id: true, fullName: true, city: true, region: true, avatarUrl: true,
              farmerProfile: { select: { rating: true, ratingCount: true, isCertified: true } }
            }
          }
        }
      })
      return NextResponse.json({ products: product ? [product] : [] })
    }

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

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'FARMER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, categoryId, pricePerUnit, unit, quantityAvailable, isOrganic, region, city, images } = body

    if (!name || !pricePerUnit || !quantityAvailable) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    let validatedImages = []
    if (images && Array.isArray(images)) {
      validatedImages = images.slice(0, 5).filter(img => typeof img === 'string' && img.startsWith('data:image/'))
    }

    const sanitizedName = sanitizeInput(name, MAX_NAME_LENGTH)
    if (!sanitizedName) {
      return NextResponse.json({ error: 'Nom invalide' }, { status: 400 })
    }

    const parsedPrice = parseFloat(pricePerUnit)
    const parsedQuantity = parseFloat(quantityAvailable)

    if (isNaN(parsedPrice) || isNaN(parsedQuantity)) {
      return NextResponse.json({ error: 'Prix ou quantité invalide' }, { status: 400 })
    }

    if (parsedPrice <= 0 || parsedPrice > MAX_PRICE) {
      return NextResponse.json({ error: `Prix invalide (max: ${MAX_PRICE} XOF)` }, { status: 400 })
    }

    if (parsedQuantity <= 0 || parsedQuantity > MAX_QUANTITY) {
      return NextResponse.json({ error: `Quantité invalide (max: ${MAX_QUANTITY})` }, { status: 400 })
    }

    const validUnits = ['kg', 'g', 'litre', 'tête', 'sac', 'panier', 'botte', 'unité']
    const sanitizedUnit = sanitizeInput(unit || 'kg', 20)
    if (!validUnits.includes(sanitizedUnit.toLowerCase())) {
      return NextResponse.json({ error: 'Unité invalide' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        farmerId: session.user.id,
        categoryId: categoryId || null,
        name: sanitizedName,
        description: sanitizeInput(description, MAX_DESCRIPTION_LENGTH),
        pricePerUnit: parsedPrice,
        unit: sanitizedUnit.toLowerCase(),
        quantityAvailable: parsedQuantity,
        isOrganic: Boolean(isOrganic),
        region: sanitizeInput(region, 50),
        city: sanitizeInput(city, 50),
        images: validatedImages,
      },
      include: { category: true }
    })

    return NextResponse.json({ message: 'Produit créé !', product }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
