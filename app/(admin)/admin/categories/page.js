'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import AdminLayout from '@/components/admin/AdminLayout'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', nameWolof: '', emoji: '', isActive: true })
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
      if (editingId) {
        await axios.put('/api/admin/categories', { id: editingId, ...form })
        toast.success('Catégorie mise à jour !')
      } else {
        await axios.post('/api/admin/categories', form)
        toast.success('Catégorie créée !')
      }
      resetForm()
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (cat) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      nameWolof: cat.nameWolof || '',
      emoji: cat.emoji || '',
      isActive: cat.isActive !== false
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return
    
    try {
      await axios.delete(`/api/admin/categories?id=${id}`)
      toast.success('Catégorie supprimée !')
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setForm({ name: '', nameWolof: '', emoji: '', isActive: true })
    setEditingId(null)
    setShowForm(false)
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
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="btn-primary"
          >
            {showForm ? 'Annuler' : 'Ajouter une catégorie'}
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
            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full mt-4 disabled:opacity-60"
            >
              {submitting ? '...' : editingId ? 'Mettre à jour' : 'Créer la catégorie'}
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
              <div key={cat.id} className={`bg-white rounded-2xl p-4 border ${cat.isActive === false ? 'border-red-200 opacity-60' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">{cat.emoji || '📁'}</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900">{cat.name}</h3>
                {cat.nameWolof && (
                  <p className="text-sm text-gray-500">{cat.nameWolof}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {cat._count.products} produit{cat._count.products !== 1 ? 's' : ''}
                </p>
                {cat.isActive === false && (
                  <span className="text-xs text-red-500 font-semibold">Désactivée</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
