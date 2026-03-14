'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import BuyerLayout from '@/components/buyer/BuyerLayout'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const statusColors = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmée' },
  PREPARING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'En préparation' },
  READY: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Prête' },
  DELIVERING: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'En livraison' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Livrée' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Annulée' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders')
      setOrders(res.data.orders || res.data)
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <BuyerLayout>
        <div className="p-6 text-center">Chargement...</div>
      </BuyerLayout>
    )
  }

  return (
    <BuyerLayout>
      <div className="p-4">
        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Mes commandes</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucune commande</h3>
            <p className="text-gray-400 mt-2">Passez votre première commande</p>
            <Link href="/buyer/home" className="btn-primary mt-6 inline-block">
              Voir les produits
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const status = statusColors[order.status] || statusColors.PENDING
              return (
                <Link key={order.id} href={`/buyer/orders/${order.id}`}
                  className="block bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                      <p className="text-xs text-gray-400">
                        {format(new Date(order.createdAt), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-green-700 block">
                        {order.totalAmount.toLocaleString()} XOF
                      </span>
                      {order.status === 'DELIVERED' && !order.review && (
                        <span className="text-xs text-amber-700 font-semibold">Avis à donner</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </BuyerLayout>
  )
}
