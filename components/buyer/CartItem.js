'use client'
import { useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function CartItem({ item, onUpdate, onRemove }) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [loading, setLoading] = useState(false)

  const updateQuantity = async (newQty) => {
    if (newQty < 1) return
    setLoading(true)
    try {
      await axios.put(`/api/cart/${item.id}`, { quantity: newQty })
      setQuantity(newQty)
      onUpdate?.()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async () => {
    setLoading(true)
    try {
      await axios.delete(`/api/cart/${item.id}`)
      onRemove?.()
    } catch (err) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setLoading(false)
    }
  }

  const product = item.product
  const total = product.pricePerUnit * quantity
  const mainImage = Array.isArray(product.images) ? product.images[0] : null

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl overflow-hidden">
          {mainImage ? (
            <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            product.category?.emoji || '🥬'
          )}
        </div>
        
        <div className="flex-1">
          <Link href={`/buyer/products/${product.id}`} className="font-bold text-gray-900 hover:text-green-600">
            {product.name}
          </Link>
          <p className="text-sm text-gray-500">{product.farmer.fullName} • {product.farmer.city}</p>
          <p className="text-sm text-gray-500">{product.pricePerUnit} XOF / {product.unit}</p>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(quantity - 1)}
                disabled={loading || quantity <= 1}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                -
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => updateQuantity(quantity + 1)}
                disabled={loading || quantity >= product.quantityAvailable}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                +
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="font-bold text-green-700">{total.toLocaleString()} XOF</span>
              <button
                onClick={removeItem}
                disabled={loading}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
