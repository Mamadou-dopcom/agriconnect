'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import FarmerLayout from '@/components/farmer/FarmerLayout'
import ImageUpload from '@/components/ImageUpload'

export default function NewProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    pricePerUnit: '',
    unit: 'kg',
    quantityAvailable: '',
    isOrganic: false,
    region: '',
    city: '',
    images: []
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/products')
      const allProducts = res.data.products || []
      const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))]
      setCategories(cats)
    } catch (err) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.name.trim()) {
      return toast.error('Le nom du produit est requis')
    }
    if (!form.pricePerUnit || parseFloat(form.pricePerUnit) <= 0) {
      return toast.error('Le prix est requis')
    }
    if (!form.quantityAvailable || parseFloat(form.quantityAvailable) <= 0) {
      return toast.error('La quantité est requise')
    }

    setSubmitting(true)
    try {
      await axios.post('/api/products', {
        ...form,
        categoryId: form.categoryId || null,
        pricePerUnit: parseFloat(form.pricePerUnit),
        quantityAvailable: parseFloat(form.quantityAvailable)
      })
      toast.success('Produit créé !')
      router.push('/farmer/products')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

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
        <Link href="/farmer/products" className="text-green-700 font-semibold mb-4 inline-block">
          ← Retour aux produits
        </Link>

        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Nouveau produit</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du produit *</label>
            <input
              className="input-field w-full"
              placeholder="Ex: Tomates Roma"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              className="input-field w-full"
              rows={3}
              placeholder="Description du produit..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
            <select
              className="input-field w-full"
              value={form.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
            >
              <option value="">Sélectionner une catégorie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Prix *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field w-full pr-12"
                  placeholder="0"
                  value={form.pricePerUnit}
                  onChange={(e) => update('pricePerUnit', e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">XOF</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Unité</label>
              <select
                className="input-field w-full"
                value={form.unit}
                onChange={(e) => update('unit', e.target.value)}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="litre">litre</option>
                <option value="tête">tête</option>
                <option value="sac">sac</option>
                <option value="panier">panier</option>
                <option value="botte">botte</option>
                <option value="unité">unité</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quantité disponible *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input-field w-full"
              placeholder="0"
              value={form.quantityAvailable}
              onChange={(e) => update('quantityAvailable', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Région</label>
              <input
                className="input-field w-full"
                placeholder="Ex: Dakar"
                value={form.region}
                onChange={(e) => update('region', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
              <input
                className="input-field w-full"
                placeholder="Ex: Pikine"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={form.isOrganic}
              onChange={(e) => update('isOrganic', e.target.checked)}
              className="w-5 h-5 text-green-600 rounded"
            />
            <span className="font-medium">🌱 Produit biologique</span>
          </label>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Photos du produit</label>
            <ImageUpload
              value={form.images}
              onChange={(images) => update('images', images)}
              max={5}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-60"
          >
            {submitting ? 'Création...' : 'Créer le produit'}
          </button>
        </form>
      </div>
    </FarmerLayout>
  )
}
