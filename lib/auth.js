import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Non authentifié')
  return user
}

export async function requireRole(role) {
  const user = await requireAuth()
  if (user.role !== role) throw new Error(`Rôle requis: ${role}`)
  return user
}
