'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import FarmerLayout from '@/components/farmer/FarmerLayout'
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

const nextStatus = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'DELIVERING',
}

export default function FarmerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

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

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId)
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus })
      toast.success('Statut mis à jour')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <FarmerLayout>
        <div className="p-4 text-center">Chargement...</div>
      </FarmerLayout>
    )
  }

  return (
    <FarmerLayout>
      <div className="p-4">
        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Commandes</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucune commande</h3>
            <p className="text-gray-400 mt-2">Vos commandes apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const status = statusColors[order.status] || statusColors.PENDING
              const next = nextStatus[order.status]
              
              return (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Link href={`/farmer/orders/${order.id}`} className="font-bold text-gray-900 hover:text-green-600">
                        #{order.orderNumber}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {format(new Date(order.createdAt), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <p className="font-medium text-gray-900">🛒 {order.buyer?.fullName}</p>
                    <p className="text-sm text-gray-500">{order.buyer?.phone}</p>
                    <p className="text-sm text-gray-500">{order.buyer?.city}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-green-700">
                      {order.totalAmount.toLocaleString()} XOF
                    </span>
                  </div>

                  {next && (
                    <button
                      onClick={() => updateStatus(order.id, next)}
                      disabled={updating === order.id}
                      className="btn-primary w-full mt-3 disabled:opacity-50"
                    >
                      {updating === order.id ? '...' : `Passer à "${statusColors[next].label}"`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </FarmerLayout>
  )
}
