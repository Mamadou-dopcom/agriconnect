'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import BuyerLayout from '@/components/buyer/BuyerLayout'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function BuyerReviewsPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders')
      const allOrders = res.data.orders || res.data
      const deliverable = allOrders.filter(o => o.status === 'DELIVERED' && !o.review)
      setOrders(deliverable)
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async () => {
    if (!selectedOrder) return
    
    setSubmitting(true)
    try {
      await axios.post('/api/reviews', {
        orderId: selectedOrder.id,
        rating,
        comment
      })
      toast.success('Merci pour votre avis !')
      setSelectedOrder(null)
      setComment('')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <BuyerLayout>
        <div className="p-4 text-center">Chargement...</div>
      </BuyerLayout>
    )
  }

  return (
    <BuyerLayout>
      <div className="p-4">
        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Avis à donner</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucun avis à donner</h3>
            <p className="text-gray-400 mt-2">Vous avez noté toutes vos commandes livrées</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(order.createdAt), 'd MMM yyyy', { locale: fr })}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      👨‍🌾 {order.farmer?.fullName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="btn-secondary text-sm"
                  >
                    Noter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="font-bold text-xl mb-4">Noter #{selectedOrder.orderNumber}</h2>
              <p className="text-gray-500 mb-4">Comment était votre expérience avec {selectedOrder.farmer?.fullName} ?</p>
              
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-3xl transition-transform hover:scale-110"
                  >
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>

              <textarea
                className="input-field w-full mb-4"
                rows={3}
                placeholder="Commentaire (optionnel)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={submitReview}
                  disabled={submitting}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {submitting ? '...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BuyerLayout>
  )
}
