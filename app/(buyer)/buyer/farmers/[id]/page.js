'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

function FarmerDetailContent() {
  const params = useParams()
  const farmerId = params?.id
  const [farmer, setFarmer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('products')
  const [eligibleOrders, setEligibleOrders] = useState([])
  const [loadingEligibleOrders, setLoadingEligibleOrders] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const fetchFarmer = async (withLoading = true) => {
    if (!farmerId || Array.isArray(farmerId)) {
      if (withLoading) setLoading(false)
      return
    }

    if (withLoading) setLoading(true)
    try {
      const res = await axios.get(`/api/farmers/${farmerId}`)
      setFarmer(res.data)
    } catch (err) {
      console.error('Failed to fetch farmer:', err)
    } finally {
      if (withLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchFarmer(true)
  }, [farmerId])

  const fetchEligibleOrders = async () => {
    if (!farmer?.id) return
    setLoadingEligibleOrders(true)
    try {
      const res = await axios.get('/api/orders?status=DELIVERED&limit=100')
      const orders = res.data.orders || []
      const available = orders.filter((order) => order.farmerId === farmer.id && !order.review)
      setEligibleOrders(available)

      const hasSelected = available.some((order) => order.id === selectedOrderId)
      if (!hasSelected) {
        setSelectedOrderId(available[0]?.id || '')
      }
    } catch {
      setEligibleOrders([])
      setSelectedOrderId('')
    } finally {
      setLoadingEligibleOrders(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'reviews' && farmer?.id) {
      fetchEligibleOrders()
    }
  }, [activeTab, farmer?.id])

  const submitReview = async () => {
    if (!selectedOrderId) {
      toast.error('Aucune commande éligible')
      return
    }

    setSubmittingReview(true)
    try {
      await axios.post('/api/reviews', {
        orderId: selectedOrderId,
        rating: reviewRating,
        comment: reviewComment
      })
      toast.success('Merci pour votre avis !')
      setShowReviewForm(false)
      setReviewComment('')
      setReviewRating(5)
      await fetchFarmer(false)
      await fetchEligibleOrders()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi de l\'avis')
    } finally {
      setSubmittingReview(false)
    }
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-yellow-400 text-lg">★</span>)
      } else if (i === fullStars && hasHalf) {
        stars.push(<span key={i} className="text-yellow-400 text-lg">★</span>)
      } else {
        stars.push(<span key={i} className="text-gray-300 text-lg">★</span>)
      }
    }
    return stars
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
      </div>
    )
  }

  if (!farmer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h3 className="font-bold text-gray-700 text-lg">Producteur non trouvé</h3>
          <Link href="/buyer/farmers" className="text-green-700 mt-4 inline-block">
            ← Retour aux producteurs
          </Link>
        </div>
      </div>
    )
  }

  const displayRating = farmer.reviewCount > 0 ? (farmer.rating || 0) : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="bg-green-700 px-4 py-6">
        <Link href="/buyer/farmers" className="text-white text-sm flex items-center gap-1 mb-4">
          ← Retour
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl overflow-hidden">
            {farmer.profileImage ? (
              <img src={farmer.profileImage} alt={farmer.farmName} className="w-full h-full object-cover" />
            ) : (
              '👨‍🌾'
            )}
          </div>
          <div className="text-white">
            <h1 className="font-sora font-bold text-xl">{farmer.farmName}</h1>
            {farmer.location && (
              <p className="text-green-200 text-sm flex items-center gap-1">📍 {farmer.location}</p>
            )}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="bg-white px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">{renderStars(displayRating)}</div>
            <p className="text-gray-500 text-xs mt-1">{displayRating.toFixed(1)} ({farmer.reviewCount} avis)</p>
          </div>
          <div className="text-center">
            <p className="text-green-700 font-bold text-xl">{farmer.products?.length || 0}</p>
            <p className="text-gray-500 text-xs">Produits</p>
          </div>
          <div className="text-center">
            <p className="text-green-700 font-bold text-xl">{farmer.totalSales}</p>
            <p className="text-gray-500 text-xs">Ventes</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white px-4 flex gap-4 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-2 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'products' 
              ? 'border-green-600 text-green-700' 
              : 'border-transparent text-gray-400'
          }`}
        >
          Produits ({farmer.products?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`py-3 px-2 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'about' 
              ? 'border-green-600 text-green-700' 
              : 'border-transparent text-gray-400'
          }`}
        >
          À propos
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`py-3 px-2 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'reviews' 
              ? 'border-green-600 text-green-700' 
              : 'border-transparent text-gray-400'
          }`}
        >
          Avis ({farmer.reviewCount})
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="p-4">
        {activeTab === 'products' && (
          <>
            {farmer.products?.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">🥬</div>
                <p className="text-gray-500">Aucun produit disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {farmer.products?.map((product) => (
                  <Link
                    key={product.id}
                    href={`/buyer/products/${product.id}`}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {product.category?.emoji || '🥬'}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{product.name}</h3>
                      <p className="text-gray-500 text-xs">{product.category?.name}</p>
                      <p className="text-green-700 font-bold mt-1">{product.pricePerUnit.toLocaleString()} CFA</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-xl p-4">
            <h3 className="font-bold text-gray-900 mb-2">À propos</h3>
            {farmer.bio ? (
              <p className="text-gray-600 text-sm leading-relaxed">{farmer.bio}</p>
            ) : (
              <p className="text-gray-400 text-sm">Aucune description</p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-500 text-xs">
                Membre depuis {formatDate(farmer.memberSince)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <>
            <div className="bg-white rounded-xl p-4 mb-3">
              <h3 className="font-bold text-gray-900">Votre avis</h3>
              {loadingEligibleOrders ? (
                <p className="text-sm text-gray-400 mt-1">Chargement...</p>
              ) : eligibleOrders.length > 0 ? (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Vous pouvez noter ce producteur ({eligibleOrders.length} commande{eligibleOrders.length > 1 ? 's' : ''} livrée{eligibleOrders.length > 1 ? 's' : ''}).
                  </p>
                  {!showReviewForm ? (
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(true)}
                      className="btn-primary mt-3"
                    >
                      Donner un avis
                    </button>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Commande livrée</label>
                        <select
                          value={selectedOrderId}
                          onChange={(e) => setSelectedOrderId(e.target.value)}
                          className="input-field w-full"
                        >
                          {eligibleOrders.map((order) => (
                            <option key={order.id} value={order.id}>
                              #{order.orderNumber}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-1 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="text-2xl"
                          >
                            <span className={star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="input-field w-full"
                        placeholder="Votre commentaire (optionnel)"
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="btn-secondary flex-1"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={submitReview}
                          disabled={submittingReview}
                          className="btn-primary flex-1 disabled:opacity-50"
                        >
                          {submittingReview ? '...' : 'Envoyer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Vous pouvez noter ce producteur uniquement après une commande livrée.
                </p>
              )}
            </div>

            {farmer.recentReviews?.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-gray-500">Aucun avis pour le moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {farmer.recentReviews?.map((review) => (
                  <div key={review.id} className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">
                          {review.buyerName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{review.buyerName}</p>
                          <div className="flex">{renderStars(review.rating)}</div>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs">{formatDate(review.createdAt)}</p>
                    </div>
                    {review.comment && (
                      <p className="text-gray-600 text-sm">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-4 py-2 z-50">
        <Link href="/buyer/home" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
          <span className="text-2xl">🏠</span>
          <span className="text-xs font-semibold">Accueil</span>
        </Link>
        <Link href="/buyer/farmers" className="flex flex-col items-center gap-0.5 px-4 py-1 text-green-700">
          <span className="text-2xl">👨‍🌾</span>
          <span className="text-xs font-semibold">Producteurs</span>
        </Link>
        <Link href="/buyer/cart" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
          <span className="text-2xl">🛒</span>
          <span className="text-xs font-semibold">Panier</span>
        </Link>
        <Link href="/buyer/orders" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
          <span className="text-2xl">📦</span>
          <span className="text-xs font-semibold">Commandes</span>
        </Link>
        <Link href="/buyer/profile" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
          <span className="text-2xl">👤</span>
          <span className="text-xs font-semibold">Profil</span>
        </Link>
      </nav>
    </div>
  )
}

export default function FarmerDetailPage() {
  return <FarmerDetailContent />
}
