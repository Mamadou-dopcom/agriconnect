'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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

export default function OrderDetailsPage() {
  const params = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    const orderId = Array.isArray(params?.id) ? params.id[0] : params?.id
    if (!orderId) {
      setLoading(false)
      return
    }

    try {
      const res = await axios.get(`/api/orders/${orderId}`)
      setOrder(res.data)
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const cancelOrder = async () => {
    if (!order) return
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      toast.error('Cette commande ne peut plus être annulée')
      return
    }

    setActionLoading(true)
    try {
      await axios.delete(`/api/orders/${order.id}`)
      toast.success('Commande annulée')
      await fetchOrder()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'annulation')
    } finally {
      setActionLoading(false)
    }
  }

  const confirmDelivery = async () => {
    if (!order) return
    if (order.status !== 'DELIVERING') {
      toast.error('Cette commande ne peut pas être confirmée')
      return
    }

    setActionLoading(true)
    try {
      await axios.patch(`/api/orders/${order.id}/status`, { status: 'DELIVERED' })
      toast.success('Commande confirmée comme livrée')
      await fetchOrder()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la confirmation')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <BuyerLayout>
        <div className="p-6 text-center">Chargement...</div>
      </BuyerLayout>
    )
  }

  if (!order) {
    return (
      <BuyerLayout>
        <div className="p-6 text-center">
          <h2 className="font-bold text-gray-700">Commande non trouvée</h2>
          <Link href="/buyer/orders" className="btn-primary mt-4 inline-block">
            Retour aux commandes
          </Link>
        </div>
      </BuyerLayout>
    )
  }

  const status = statusColors[order.status] || statusColors.PENDING

  return (
    <BuyerLayout>
      <div className="p-4">
        <Link href="/buyer/orders" className="text-green-700 font-semibold mb-4 inline-block">
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

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Informations</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Agriculteur</span>
              <span className="font-semibold">{order.farmer?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mode de paiement</span>
              <span className="font-semibold">
                {order.paymentMethod === 'WAVE' ? '📱 Wave' : 
                 order.paymentMethod === 'ORANGE_MONEY' ? '🟠 Orange Money' : '💵 Espèces'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Statut paiement</span>
              <span className={`font-semibold ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.paymentStatus === 'PAID' ? 'Payé' : 
                 order.paymentStatus === 'REFUNDED' ? 'Remboursé' : 'En attente'}
              </span>
            </div>
          </div>

          {order.status === 'DELIVERED' && !order.review && (
            <Link href="/buyer/reviews" className="btn-primary w-full mt-4 inline-flex justify-center">
              Donner un avis
            </Link>
          )}

          {order.review && (
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-xl">
              <p className="text-sm font-semibold text-green-700">Avis déjà envoyé</p>
              <p className="text-sm text-gray-600 mt-1">Note: {order.review.rating}/5</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-2">
            {['PENDING', 'CONFIRMED'].includes(order.status) && (
              <button
                type="button"
                onClick={cancelOrder}
                disabled={actionLoading}
                className="btn-secondary w-full text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                {actionLoading ? '...' : 'Annuler la commande'}
              </button>
            )}

            {order.status === 'DELIVERING' && (
              <button
                type="button"
                onClick={confirmDelivery}
                disabled={actionLoading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {actionLoading ? '...' : 'Confirmer la réception'}
              </button>
            )}
          </div>
        </div>
      </div>
    </BuyerLayout>
  )
}
