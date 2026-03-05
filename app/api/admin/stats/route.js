import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const [
      totalUsers, totalFarmers, totalBuyers,
      totalOrders, pendingOrders, deliveredOrders,
      totalProducts, activeProducts,
      revenueData, recentOrders, topFarmers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'FARMER' } }),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.product.count(),
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.order.aggregate({
        _sum: { platformCommission: true, totalAmount: true },
        where: { paymentStatus: 'PAID' }
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { fullName: true } },
          farmer: { select: { fullName: true } },
        }
      }),
      prisma.user.findMany({
        where: { role: 'FARMER' },
        take: 5,
        include: { farmerProfile: true },
        orderBy: { farmerProfile: { totalSales: 'desc' } }
      }),
    ])

    // Revenus par méthode de paiement
    const paymentStats = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _sum: { totalAmount: true },
      _count: true,
      where: { paymentStatus: 'PAID' }
    })

    // Commandes par statut
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    })

    return NextResponse.json({
      users: { total: totalUsers, farmers: totalFarmers, buyers: totalBuyers },
      orders: { total: totalOrders, pending: pendingOrders, delivered: deliveredOrders },
      products: { total: totalProducts, active: activeProducts },
      revenue: {
        totalCommission: revenueData._sum.platformCommission || 0,
        totalVolume: revenueData._sum.totalAmount || 0,
      },
      paymentStats,
      ordersByStatus,
      recentOrders,
      topFarmers,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
