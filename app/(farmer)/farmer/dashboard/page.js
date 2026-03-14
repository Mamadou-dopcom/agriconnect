import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import FarmerLayout from '@/components/farmer/FarmerLayout'
import OrderCard from '@/components/farmer/OrderCard'

async function getFarmerData(userId) {
  const [stats, recentOrders, notifications] = await Promise.all([
    prisma.order.aggregate({
      where: { farmerId: userId },
      _count: { id: true },
      _sum: { platformCommission: true, totalAmount: true }
    }),
    prisma.order.findMany({
      where: { farmerId: userId },
      take: 5, orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { fullName: true, phone: true } },
        items: true
      }
    }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      take: 5, orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({ where: { farmerId: userId, status: 'PENDING' } }),
  ])

  const pending = await prisma.order.count({ where: { farmerId: userId, status: 'PENDING' } })
  const delivered = await prisma.order.count({ where: { farmerId: userId, status: 'DELIVERED' } })
  const products = await prisma.product.count({ where: { farmerId: userId, isAvailable: true } })

  return {
    totalOrders: stats._count.id,
    totalEarned: stats._sum.totalAmount || 0,
    pending, delivered, products,
    recentOrders, notifications
  }
}

export default async function FarmerDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'FARMER') redirect('/')

  const data = await getFarmerData(session.user.id)

  return (
    <FarmerLayout>
      <div className="p-4 space-y-4">
        {/* HEADER */}
        <div className="bg-green-700 -mx-4 -mt-4 px-6 pt-8 pb-6 mb-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-sora font-bold text-2xl text-white">
                Bonjour {session.user.name?.split(' ')[0]} 🌾
              </h1>
              <p className="text-green-200 text-sm mt-1">{session.user.city || 'Sénégal'}</p>
            </div>
            <a href="/farmer/products/new"
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              Ajouter un produit
            </a>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '💰', value: `${Math.round(data.totalEarned / 1000)}k`, label: 'FCFA gagnés', color: 'border-green-500' },
            { icon: '📦', value: data.totalOrders, label: 'Commandes', color: 'border-blue-500' },
            { icon: '⏳', value: data.pending, label: 'En attente', color: 'border-yellow-500' },
            { icon: '🌿', value: data.products, label: 'Produits actifs', color: 'border-emerald-500' },
          ].map((s, i) => (
            <div key={i} className={`card border-l-4 ${s.color} py-4`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-sora font-black text-2xl text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* COMMANDES RÉCENTES */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-sora font-bold text-gray-900">Nouvelles commandes</h3>
            <a href="/farmer/orders" className="text-green-700 text-sm font-semibold">Tout voir →</a>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-500 font-medium">Pas encore de commandes</p>
              <p className="text-gray-400 text-sm mt-1">Partagez votre profil pour recevoir des commandes !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </FarmerLayout>
  )
}
