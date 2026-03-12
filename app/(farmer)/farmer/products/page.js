'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import FarmerLayout from '@/components/farmer/FarmerLayout'

export default function FarmerProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/farmer/products')
      setProducts(res.data.products || [])
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return
    
    setDeleting(id)
    try {
      await axios.delete(`/api/farmer/products/${id}`)
      toast.success('Produit supprimé')
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression')
    } finally {
      setDeleting(null)
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-sora font-bold text-xl text-gray-900">Mes produits</h1>
          <Link href="/farmer/products/new" className="btn-primary">
            + Ajouter
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🌿</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucun produit</h3>
            <p className="text-gray-400 mt-2">Ajoutez votre premier produit</p>
            <Link href="/farmer/products/new" className="btn-primary mt-6 inline-block">
              Ajouter un produit
            </Link>
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
                        {product.category?.name || 'Sans catégorie'}
                      </p>
                      <p className="text-sm font-semibold text-green-700 mt-1">
                        {product.pricePerUnit.toLocaleString()} XOF / {product.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      product.isAvailable 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {product.isAvailable ? 'Actif' : 'Inactif'}
                    </span>
                    <span className="text-xs text-gray-400">
                      Stock: {product.quantityAvailable} {product.unit}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Link 
                    href={`/farmer/products/${product.id}/edit`}
                    className="flex-1 text-center py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
                  >
                    Modifier
                  </Link>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    disabled={deleting === product.id}
                    className="flex-1 text-center py-2 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleting === product.id ? '...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FarmerLayout>
  )
}
