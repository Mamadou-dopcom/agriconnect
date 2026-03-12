'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/AdminLayout'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [search])

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      
      const res = await axios.get(`/api/admin/products?${params}`)
      setProducts(res.data.products || [])
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
        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Produits</h1>

        <input
          type="text"
          placeholder="Rechercher un produit..."
          className="input-field w-full mb-4"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🌿</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucun produit</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center text-3xl">
                      {product.category?.emoji || '🌿'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        👨‍🌾 {product.farmer?.fullName} • {product.farmer?.city}
                      </p>
                      <p className="text-sm text-gray-400">
                        {product.category?.name || 'Sans catégorie'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      product.isAvailable 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {product.isAvailable ? 'Actif' : 'Inactif'}
                    </span>
                    <p className="font-bold text-green-700 mt-2">
                      {product.pricePerUnit.toLocaleString()} XOF/{product.unit}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t flex justify-between text-sm text-gray-500">
                  <span>Stock: {product.quantityAvailable} {product.unit}</span>
                  <span>{product.ordersCount} commande{product.ordersCount !== 1 ? 's' : ''}</span>
                  <span>Créé le {format(new Date(product.createdAt), 'd MMM yyyy', { locale: fr })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
