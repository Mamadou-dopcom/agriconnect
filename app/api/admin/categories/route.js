import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { isValidUUID } from '@/lib/validation'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { name, nameWolof, emoji, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        nameWolof: nameWolof || null,
        emoji: emoji || null,
        description: description || null,
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, nameWolof, emoji, description, isActive } = body

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        nameWolof: nameWolof || null,
        emoji: emoji || null,
        description: description || null,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      }
    })

    return NextResponse.json(category)
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    })

    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une catégorie utilisée par des produits' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Catégorie supprimée' })
  } catch (err) {
    console.error(err)
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }
    if (err.code === 'P2003') {
      return NextResponse.json(
        { error: 'Impossible de supprimer une catégorie liée à des produits' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
