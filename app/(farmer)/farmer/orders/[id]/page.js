'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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

export default function FarmerOrderDetailsPage() {
  const params = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const res = await axios.get('/api/orders')
      const orders = res.data.orders || res.data
      const found = orders.find(o => o.id === params.id)
      setOrder(found)
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus) => {
    setUpdating(true)
    try {
      await axios.patch(`/api/orders/${params.id}/status`, { status: newStatus })
      toast.success('Statut mis à jour')
      fetchOrder()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <FarmerLayout>
        <div className="p-4 text-center">Chargement...</div>
      </FarmerLayout>
    )
  }

  if (!order) {
    return (
      <FarmerLayout>
        <div className="p-6 text-center">
          <h2 className="font-bold text-gray-700">Commande non trouvée</h2>
          <Link href="/farmer/orders" className="btn-primary mt-4 inline-block">
            Retour aux commandes
          </Link>
        </div>
      </FarmerLayout>
    )
  }

  const status = statusColors[order.status] || statusColors.PENDING
  const next = nextStatus[order.status]

  return (
    <FarmerLayout>
      <div className="p-4">
        <Link href="/farmer/orders" className="text-green-700 font-semibold mb-4 inline-block">
          ← Retour aux commandes
        </Link>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="font-sora font-bold text-xl text-gray-900">Commande #{order.orderNumber}</h1>
              <p className="text-sm text-gray-400">
                {format(new Date(order.createdAt), 'd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${status.bg} ${status.text}`}>
              {status.label}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-900 mb-2">Client</h3>
            <p className="font-medium">👤 {order.buyer?.fullName}</p>
            <p className="text-sm text-gray-500">📱 {order.buyer?.phone}</p>
            <p className="text-sm text-gray-500">📍 {order.buyer?.city}</p>
            {order.deliveryAddress && (
              <p className="text-sm text-gray-500 mt-2">🚚 {order.deliveryAddress}</p>
            )}
          </div>

          <div className="space-y-3 border-t pt-4">
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <span className="font-semibold text-gray-900">{item.productName}</span>
                  <p className="text-sm text-gray-400">{item.quantity} {item.unit} × {item.unitPrice} XOF</p>
                </div>
                <span className="font-semibold">{item.totalPrice.toLocaleString()} XOF</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span>{order.subtotal.toLocaleString()} XOF</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Frais de livraison</span>
              <span>{order.deliveryFee.toLocaleString()} XOF</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Commission</span>
              <span>{order.platformCommission.toLocaleString()} XOF</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-green-700">{order.totalAmount.toLocaleString()} XOF</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <h3 className="font-bold text-gray-900 mb-3">Changer le statut</h3>
          <div className="space-y-2">
            {Object.entries(statusColors).map(([key, value]) => {
              const isCurrent = key === order.status
              const isNext = key === next
              return (
                <button
                  key={key}
                  onClick={() => updateStatus(key)}
                  disabled={isCurrent || (!isNext && !isCurrent)}
                  className={`w-full p-3 rounded-xl text-left font-medium ${
                    isCurrent 
                      ? `${value.bg} ${value.text} border-2 border-current`
                      : isNext
                        ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {value.label}
                  {isCurrent && ' (actuel)'}
                  {isNext && ' →'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2">Paiement</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Mode</span>
              <span className="font-semibold">
                {order.paymentMethod === 'WAVE' ? '📱 Wave' : 
                 order.paymentMethod === 'ORANGE_MONEY' ? '🟠 Orange Money' : '💵 Espèces'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Statut</span>
              <span className={`font-semibold ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.paymentStatus === 'PAID' ? 'Payé' : 
                 order.paymentStatus === 'REFUNDED' ? 'Remboursé' : 'En attente'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </FarmerLayout>
  )
}
