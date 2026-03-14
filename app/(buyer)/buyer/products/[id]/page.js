'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import BuyerLayout from '@/components/buyer/BuyerLayout'

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`/api/products?id=${params.id}`)
      if (res.data.products?.length > 0) {
        setProduct(res.data.products[0])
      }
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async () => {
    if (!product) return
    setAdding(true)
    try {
      await axios.post('/api/cart', {
        productId: product.id,
        quantity
      })
      toast.success('Ajouté au panier !')
      router.push('/buyer/cart')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <BuyerLayout>
        <div className="p-6 text-center">Chargement...</div>
      </BuyerLayout>
    )
  }

  if (!product) {
    return (
      <BuyerLayout>
        <div className="p-6 text-center">
          <h2 className="font-bold text-gray-700">Produit non trouvé</h2>
          <Link href="/buyer/home" className="btn-primary mt-4 inline-block">
            Retour aux produits
          </Link>
        </div>
      </BuyerLayout>
    )
  }

  const total = product.pricePerUnit * quantity
  const mainImage = Array.isArray(product.images) ? product.images[0] : null
  const farmerRatingCount = product.farmer?.farmerProfile?.ratingCount || 0
  const farmerRating = farmerRatingCount > 0 ? (product.farmer?.farmerProfile?.rating || 0) : 0

  const renderStars = (value) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      )
    }
    return stars
  }

  return (
    <BuyerLayout>
      <div className="p-4">
        <Link href="/buyer/home" className="text-green-700 font-semibold mb-4 inline-block">
          ← Retour aux produits
        </Link>

        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          <div className="h-48 bg-green-50 flex items-center justify-center text-7xl overflow-hidden">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              product.category?.emoji || '🌿'
            )}
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-sora font-bold text-xl text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {product.category?.name}
                </p>
              </div>
              {product.isOrganic && (
                <span className="text-sm bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">🌱 Bio</span>
              )}
            </div>

            <Link href={`/buyer/farmers/${product.farmer.id}`} className="block mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="font-semibold text-gray-900">👨‍🌾 {product.farmer.fullName}</p>
              <p className="text-sm text-gray-500">{product.farmer.city} • {product.farmer.region}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="text-sm flex">{renderStars(farmerRating)}</div>
                <p className="text-sm text-gray-500">
                  {farmerRating.toFixed(1)} ({farmerRatingCount} avis)
                </p>
              </div>
            </Link>

            {product.description && (
              <p className="mt-4 text-gray-600">{product.description}</p>
            )}

            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <span>📍 {product.city}</span>
              <span>•</span>
              <span>📦 {product.quantityAvailable} {product.unit} disponible(s)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 mt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500">Prix</span>
            <span className="font-black text-2xl text-green-700">
              {product.pricePerUnit.toLocaleString()} <span className="text-sm font-normal">XOF/{product.unit}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Quantité</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 font-bold"
              >
                -
              </button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.quantityAvailable, quantity + 1))}
                disabled={quantity >= product.quantityAvailable}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 font-bold disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <span className="font-bold text-gray-500">Total</span>
            <span className="font-black text-xl text-green-700">{total.toLocaleString()} XOF</span>
          </div>

          <button
            onClick={addToCart}
            disabled={adding || product.quantityAvailable < 1}
            className="btn-primary w-full mt-4 disabled:opacity-50"
          >
            {adding ? '⏳ Ajout...' : '🛒 Ajouter au panier'}
          </button>
        </div>
      </div>
    </BuyerLayout>
  )
}
