import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const cart = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            farmer: {
              select: { id: true, fullName: true, city: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(cart)
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

    const { productId, quantity = 1 } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Produit requis' }, { status: 400 })
    }

    const parsedQuantity = parseFloat(quantity)
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 })
    }

    if (parsedQuantity > 10000) {
      return NextResponse.json({ error: 'Quantité maximale: 10000' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { farmer: true }
    })

    if (!product || !product.isAvailable) {
      return NextResponse.json({ error: 'Produit non disponible' }, { status: 400 })
    }

    if (product.quantityAvailable < parsedQuantity) {
      return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 })
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { userId: session.user.id, productId }
    })

    if (existingItem) {
      const newQuantity = existingItem.quantity + parsedQuantity
      if (newQuantity > product.quantityAvailable) {
        return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 })
      }

      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      })
      return NextResponse.json(updated)
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        userId: session.user.id,
        productId,
        quantity: parsedQuantity
      }
    })

    return NextResponse.json(cartItem, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
