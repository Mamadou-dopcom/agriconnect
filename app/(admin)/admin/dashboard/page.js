import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminLayout from '@/components/admin/AdminLayout'
import StatsCard from '@/components/admin/StatsCard'
import RecentOrders from '@/components/admin/RecentOrders'
import RevenueChart from '@/components/admin/RevenueChart'

async function getStats() {
  const [
    totalFarmers, totalBuyers, totalOrders,
    pendingOrders, totalProducts, revenueData,
    recentOrders, paymentStats
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'FARMER' } }),
    prisma.user.count({ where: { role: 'BUYER' } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.product.count({ where: { isAvailable: true } }),
    prisma.order.aggregate({
      _sum: { platformCommission: true, totalAmount: true },
      where: { paymentStatus: 'PAID' }
    }),
    prisma.order.findMany({
      take: 8, orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { fullName: true } },
        farmer: { select: { fullName: true } },
      }
    }),
    prisma.order.groupBy({
      by: ['paymentMethod'], _sum: { totalAmount: true }, _count: true,
      where: { paymentStatus: 'PAID' }
    }),
  ])

  return {
    totalFarmers, totalBuyers, totalOrders, pendingOrders, totalProducts,
    totalCommission: revenueData._sum.platformCommission || 0,
    totalVolume: revenueData._sum.totalAmount || 0,
    recentOrders, paymentStats
  }
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const stats = await getStats()

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-sora font-bold text-2xl text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">Bienvenue sur AgriConnect Admin 👋</p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon="💰" value={`${Math.round(stats.totalCommission / 1000)}k`}
            label="Commission FCFA" color="green" change="+23% ce mois" />
          <StatsCard icon="📦" value={stats.totalOrders}
            label="Commandes" color="blue" change="+18% ce mois" />
          <StatsCard icon="👨‍🌾" value={stats.totalFarmers}
            label="Agriculteurs" color="emerald" change={`${stats.pendingOrders} en attente`} />
          <StatsCard icon="🛒" value={stats.totalBuyers}
            label="Acheteurs" color="orange" change={`${stats.totalProducts} produits actifs`} />
        </div>

        {/* CHARTS + PAYMENT */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <div className="card">
            <h3 className="font-sora font-bold text-gray-900 mb-4">💳 Paiements</h3>
            <div className="space-y-4">
              {[
                { method: 'WAVE', icon: '📱', label: 'Wave', pct: 62, color: 'bg-green-500' },
                { method: 'ORANGE_MONEY', icon: '🟠', label: 'Orange Money', pct: 25, color: 'bg-orange-500' },
                { method: 'CASH', icon: '💵', label: 'Cash', pct: 13, color: 'bg-gray-400' },
              ].map(p => (
                <div key={p.method} className="flex items-center gap-3">
                  <span className="text-xl">{p.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{p.label}</span>
                      <span className="text-sm font-bold text-gray-900">{p.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Volume total</span>
                <span className="font-bold text-green-700">{stats.totalVolume.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT ORDERS */}
        <RecentOrders orders={stats.recentOrders} />
      </div>
    </AdminLayout>
  )
}
