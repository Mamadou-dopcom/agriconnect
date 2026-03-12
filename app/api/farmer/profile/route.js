import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { farmerProfile: true }
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
    if (!session || session.user.role !== 'FARMER') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, email, phone, city, region, address, farmName, farmDescription, farmSizeHectares, yearsExperience, specialties, deliveryRadiusKm, acceptsDelivery, bankAccountWave, bankAccountOrange } = body

    const userData = {}
    const profileData = {}

    if (fullName) userData.fullName = sanitizeInput(fullName, 100)
    if (email !== undefined) userData.email = email ? sanitizeInput(email, 100) : null
    if (city !== undefined) userData.city = sanitizeInput(city, 50)
    if (region !== undefined) userData.region = sanitizeInput(region, 50)
    if (address !== undefined) userData.address = sanitizeInput(address, 200)

    if (farmName !== undefined) profileData.farmName = sanitizeInput(farmName, 100)
    if (farmDescription !== undefined) profileData.farmDescription = sanitizeInput(farmDescription, 1000)
    if (farmSizeHectares !== undefined) {
      const size = parseFloat(farmSizeHectares)
      if (!isNaN(size) && size >= 0) profileData.farmSizeHectares = size
    }
    if (yearsExperience !== undefined) {
      const years = parseInt(yearsExperience)
      if (!isNaN(years) && years >= 0) profileData.yearsExperience = years
    }
    if (specialties !== undefined) {
      if (Array.isArray(specialties)) profileData.specialties = specialties.slice(0, 10)
    }
    if (deliveryRadiusKm !== undefined) {
      const radius = parseInt(deliveryRadiusKm)
      if (!isNaN(radius) && radius >= 0) profileData.deliveryRadiusKm = radius
    }
    if (acceptsDelivery !== undefined) profileData.acceptsDelivery = Boolean(acceptsDelivery)
    if (bankAccountWave !== undefined) profileData.bankAccountWave = sanitizeInput(bankAccountWave, 20)
    if (bankAccountOrange !== undefined) profileData.bankAccountOrange = sanitizeInput(bankAccountOrange, 20)

    const [user, profile] = await Promise.all([
      Object.keys(userData).length > 0 
        ? prisma.user.update({ where: { id: session.user.id }, data: userData })
        : prisma.user.findUnique({ where: { id: session.user.id } }),
      Object.keys(profileData).length > 0
        ? prisma.farmerProfile.update({ where: { userId: session.user.id }, data: profileData })
        : prisma.farmerProfile.findUnique({ where: { userId: session.user.id } })
    ])

    return NextResponse.json({ message: 'Profil mis à jour', user, profile })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
