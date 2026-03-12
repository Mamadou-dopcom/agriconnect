import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

function isValidSenegalPhone(phone) {
  const cleaned = phone.replace(/\s/g, '')
  return /^(\+221)?[2376]\d{7}$/.test(cleaned)
}

function isValidEmail(email) {
  if (!email) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword(password) {
  if (password.length < 6) {
    return 'Mot de passe trop court (min 6 caractères)'
  }
  return null
}

export async function POST(request) {
  try {
    const { phone, email, fullName, password, confirmPassword, role, region, city } = await request.json()

    if (!phone || !fullName || !password || !role) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    if (!isValidSenegalPhone(phone)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide (format: 77 XXX XX XX)' }, { status: 400 })
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Les mots de passe ne correspondent pas' }, { status: 400 })
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    if (fullName.length > 100) {
      return NextResponse.json({ error: 'Nom trop long (max 100 caractères)' }, { status: 400 })
    }

    if (region && region.length > 50) {
      return NextResponse.json({ error: 'Région trop longue (max 50 caractères)' }, { status: 400 })
    }

    if (city && city.length > 50) {
      return NextResponse.json({ error: 'Ville trop longue (max 50 caractères)' }, { status: 400 })
    }

    const normalizedPhone = phone.replace(/\s/g, '')
    const normalizedRole = role.toUpperCase()
    
    if (!['FARMER', 'BUYER'].includes(normalizedRole)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } })
    if (existing) {
      return NextResponse.json({ error: 'Ce numéro est déjà utilisé' }, { status: 409 })
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        phone: normalizedPhone,
        email: email || null,
        fullName: fullName.trim(),
        passwordHash,
        role: normalizedRole,
        region: region?.trim() || null,
        city: city?.trim() || null,
        ...(normalizedRole === 'FARMER' && {
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
