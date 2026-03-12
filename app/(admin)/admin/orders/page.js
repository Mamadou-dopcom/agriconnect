'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/AdminLayout'
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      
      const res = await axios.get(`/api/admin/orders?${params}`)
      setOrders(res.data.orders || [])
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-center">Chargement...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Commandes</h1>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              !statusFilter ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Toutes
          </button>
          {Object.entries(statusColors).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                statusFilter === key ? `${value.bg} ${value.text}` : 'bg-gray-100 text-gray-600'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucune commande</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const status = statusColors[order.status] || statusColors.PENDING
              return (
                <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                      <p className="text-xs text-gray-400">
                        {format(new Date(order.createdAt), 'd MMM yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Acheteur</p>
                      <p className="font-medium">🛒 {order.buyer?.fullName}</p>
                      <p className="text-gray-500">{order.buyer?.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Agriculteur</p>
                      <p className="font-medium">👨‍🌾 {order.farmer?.fullName}</p>
                      <p className="text-gray-500">{order.farmer?.phone}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {order.items?.length || 0} article{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-green-700">
                      {order.totalAmount.toLocaleString()} XOF
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
