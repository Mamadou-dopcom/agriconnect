import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const MAX_PRICE = 1000000
const MAX_QUANTITY = 100000
const MAX_NAME_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000

function sanitizeInput(input, maxLength = 500) {
  if (!input || typeof input !== 'string') return null
  return input.trim().slice(0, maxLength)
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'FARMER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: { id, farmerId: session.user.id },
      include: { category: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'FARMER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const existing = await prisma.product.findFirst({
      where: { id, farmerId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, categoryId, pricePerUnit, unit, quantityAvailable, isOrganic, isAvailable, region, city } = body

    if (name) {
      const sanitizedName = sanitizeInput(name, MAX_NAME_LENGTH)
      if (!sanitizedName) {
        return NextResponse.json({ error: 'Nom invalide' }, { status: 400 })
      }
    }

    const updateData = {}

    if (name) updateData.name = sanitizeInput(name, MAX_NAME_LENGTH)
    if (description !== undefined) updateData.description = sanitizeInput(description, MAX_DESCRIPTION_LENGTH)
    if (categoryId !== undefined) updateData.categoryId = categoryId || null
    if (region !== undefined) updateData.region = sanitizeInput(region, 50)
    if (city !== undefined) updateData.city = sanitizeInput(city, 50)
    if (isOrganic !== undefined) updateData.isOrganic = Boolean(isOrganic)
    if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable)

    if (pricePerUnit !== undefined) {
      const parsedPrice = parseFloat(pricePerUnit)
      if (isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice > MAX_PRICE) {
        return NextResponse.json({ error: `Prix invalide (max: ${MAX_PRICE} XOF)` }, { status: 400 })
      }
      updateData.pricePerUnit = parsedPrice
    }

    if (quantityAvailable !== undefined) {
      const parsedQty = parseFloat(quantityAvailable)
      if (isNaN(parsedQty) || parsedQty < 0 || parsedQty > MAX_QUANTITY) {
        return NextResponse.json({ error: `Quantité invalide (max: ${MAX_QUANTITY})` }, { status: 400 })
      }
      updateData.quantityAvailable = parsedQty
    }

    if (unit) {
      const sanitizedUnit = sanitizeInput(unit, 20)
      const validUnits = ['kg', 'g', 'litre', 'tête', 'sac', 'panier', 'botte', 'unité']
      if (sanitizedUnit && !validUnits.includes(sanitizedUnit.toLowerCase())) {
        return NextResponse.json({ error: 'Unité invalide' }, { status: 400 })
      }
      if (sanitizedUnit) updateData.unit = sanitizedUnit.toLowerCase()
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true }
    })

    return NextResponse.json({ message: 'Produit mis à jour', product })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'FARMER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const existing = await prisma.product.findFirst({
      where: { id, farmerId: session.user.id },
      include: { orderItems: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    if (existing.orderItems.length > 0) {
      return NextResponse.json({ error: 'Impossible de supprimer un produit avec des commandes' }, { status: 400 })
    }

    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ message: 'Produit supprimé' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
