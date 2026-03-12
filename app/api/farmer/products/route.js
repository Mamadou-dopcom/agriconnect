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

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'FARMER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { farmerId: session.user.id },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where: { farmerId: session.user.id } })
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
