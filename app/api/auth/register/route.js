import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { phone, email, fullName, password, role, region, city } = await request.json()

    if (!phone || !fullName || !password || !role) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court (min 6 caractères)' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ error: 'Ce numéro est déjà utilisé' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        phone, email, fullName, passwordHash,
        role: role.toUpperCase(),
        region, city,
        ...(role.toUpperCase() === 'FARMER' && {
          farmerProfile: { create: {} }
        })
      },
      select: { id: true, phone: true, fullName: true, role: true }
    })

    return NextResponse.json({
      message: `Bienvenue sur AgriConnect ${fullName} ! 🌾`,
      user
    }, { status: 201 })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 })
  }
}
