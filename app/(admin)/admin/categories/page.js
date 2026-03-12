'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/AdminLayout'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', nameWolof: '', emoji: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/admin/categories')
      setCategories(res.data || [])
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      return toast.error('Le nom est requis')
    }

    setSubmitting(true)
    try {
      await axios.post('/api/admin/categories', form)
      toast.success('Catégorie créée !')
      setForm({ name: '', nameWolof: '', emoji: '' })
      setShowForm(false)
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setSubmitting(false)
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
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-sora font-bold text-xl text-gray-900">Catégories</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
                <input
                  className="input-field w-full"
                  placeholder="Ex: Légumes"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom (Wolof)</label>
                <input
                  className="input-field w-full"
                  placeholder="Ex: Légim"
                  value={form.nameWolof}
                  onChange={(e) => setForm(prev => ({ ...prev, nameWolof: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Emoji</label>
                <input
                  className="input-field w-full"
                  placeholder="Ex: 🥬"
                  value={form.emoji}
                  onChange={(e) => setForm(prev => ({ ...prev, emoji: e.target.value }))}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full mt-4 disabled:opacity-60"
            >
              {submitting ? 'Création...' : 'Créer la catégorie'}
            </button>
          </form>
        )}

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📂</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucune catégorie</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                <div className="text-4xl mb-2">{cat.emoji || '📁'}</div>
                <h3 className="font-bold text-gray-900">{cat.name}</h3>
                {cat.nameWolof && (
                  <p className="text-sm text-gray-500">{cat.nameWolof}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {cat._count.products} produit{cat._count.products !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
