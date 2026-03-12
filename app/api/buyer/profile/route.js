import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

function sanitizeInput(input, maxLength = 500) {
  if (!input || typeof input !== 'string') return null
  return input.trim().slice(0, maxLength)
}

function isValidEmail(email) {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'BUYER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, email, city, region, address } = body

    const updateData = {}

    if (fullName) updateData.fullName = sanitizeInput(fullName, 100)
    if (email !== undefined) {
      if (email && !isValidEmail(email)) {
        return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
      }
      updateData.email = email ? sanitizeInput(email, 100) : null
    }
    if (city !== undefined) updateData.city = sanitizeInput(city, 50)
    if (region !== undefined) updateData.region = sanitizeInput(region, 50)
    if (address !== undefined) updateData.address = sanitizeInput(address, 200)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    })

    return NextResponse.json({ message: 'Profil mis à jour', user })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
