'use client'
import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const statusConfig = {
  PENDING: { label: '⏳ En attente', class: 'badge-pending', next: 'CONFIRMED', nextLabel: '✅ Confirmer' },
  CONFIRMED: { label: '✅ Confirmée', class: 'badge-confirmed', next: 'PREPARING', nextLabel: '👨‍🌾 Préparer' },
  PREPARING: { label: '👨‍🌾 Préparation', class: 'badge-preparing', next: 'READY', nextLabel: '📦 Prête' },
  READY: { label: '📦 Prête', class: 'badge-confirmed', next: 'DELIVERING', nextLabel: '🚴 En livraison' },
  DELIVERING: { label: '🚴 Livraison', class: 'badge-preparing', next: 'DELIVERED', nextLabel: '✅ Livrée' },
  DELIVERED: { label: '✅ Livrée', class: 'badge-delivered', next: null },
  CANCELLED: { label: '❌ Annulée', class: 'badge-cancelled', next: null },
}

export default function OrderCard({ order }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const status = statusConfig[order.status] || statusConfig.PENDING

  const updateStatus = async (newStatus) => {
    setLoading(true)
    try {
      await axios.put(`/api/orders/${order.id}/status`, { status: newStatus })
      toast.success('Statut mis à jour !')
      router.refresh()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-gray-900 text-sm">#{order.orderNumber}</span>
        <span className={status.class}>{status.label}</span>
      </div>
      <p className="text-sm text-gray-500">👤 {order.buyer.fullName} · {order.buyer.phone}</p>
      <p className="text-sm font-bold text-green-700 mt-1">💰 {order.totalAmount.toLocaleString()} FCFA</p>
      <p className="text-xs text-gray-400 mt-1">
        🕐 {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </p>

      {status.next && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => updateStatus(status.next)}
            disabled={loading}
            className="flex-1 bg-green-700 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60">
            {loading ? '⏳...' : status.nextLabel}
          </button>
          {order.status === 'PENDING' && (
            <button
              onClick={() => updateStatus('CANCELLED')}
              disabled={loading}
              className="px-3 bg-red-100 text-red-600 text-xs font-bold py-2 rounded-lg hover:bg-red-200 transition-colors">
              ❌
            </button>
          )}
        </div>
      )}
    </div>
  )
}
