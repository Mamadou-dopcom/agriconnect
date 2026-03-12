'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import FarmerLayout from '@/components/farmer/FarmerLayout'

export default function FarmerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    region: '',
    farmName: '',
    farmDescription: '',
    farmSizeHectares: '',
    yearsExperience: '',
    specialties: '',
    deliveryRadiusKm: '50',
    acceptsDelivery: true,
    bankAccountWave: '',
    bankAccountOrange: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/farmer/profile')
      const u = res.data
      setUser(u)
      setForm({
        fullName: u.fullName || '',
        email: u.email || '',
        phone: u.phone || '',
        city: u.city || '',
        region: u.region || '',
        farmName: u.farmerProfile?.farmName || '',
        farmDescription: u.farmerProfile?.farmDescription || '',
        farmSizeHectares: u.farmerProfile?.farmSizeHectares?.toString() || '',
        yearsExperience: u.farmerProfile?.yearsExperience?.toString() || '',
        specialties: u.farmerProfile?.specialties?.join(', ') || '',
        deliveryRadiusKm: u.farmerProfile?.deliveryRadiusKm?.toString() || '50',
        acceptsDelivery: u.farmerProfile?.acceptsDelivery !== false,
        bankAccountWave: u.farmerProfile?.bankAccountWave || '',
        bankAccountOrange: u.farmerProfile?.bankAccountOrange || ''
      })
    } catch (err) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        ...form,
        specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean)
      }
      await axios.put('/api/farmer/profile', data)
      toast.success('Profil mis à jour !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
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
        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Mon profil</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">Informations personnelles</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom complet</label>
                <input
                  className="input-field w-full"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                <input
                  className="input-field w-full"
                  value={form.phone}
                  disabled
                  className="input-field w-full bg-gray-100"
                />
                <p className="text-xs text-gray-400 mt-1">Le téléphone ne peut pas être modifié</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input-field w-full"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ville</label>
                  <input
                    className="input-field w-full"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Région</label>
                  <input
                    className="input-field w-full"
                    value={form.region}
                    onChange={(e) => update('region', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">Informations de la ferme</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom de la ferme</label>
                <input
                  className="input-field w-full"
                  value={form.farmName}
                  onChange={(e) => update('farmName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  className="input-field w-full"
                  rows={3}
                  value={form.farmDescription}
                  onChange={(e) => update('farmDescription', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Taille (hectares)</label>
                  <input
                    type="number"
                    className="input-field w-full"
                    value={form.farmSizeHectares}
                    onChange={(e) => update('farmSizeHectares', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Années d'expérience</label>
                  <input
                    type="number"
                    className="input-field w-full"
                    value={form.yearsExperience}
                    onChange={(e) => update('yearsExperience', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Spécialités (séparées par virgule)</label>
                <input
                  className="input-field w-full"
                  placeholder="Légumes, Tomates, Oignons..."
                  value={form.specialties}
                  onChange={(e) => update('specialties', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">Livraison</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={form.acceptsDelivery}
                  onChange={(e) => update('acceptsDelivery', e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <span className="font-medium">J'accepte les livraisons</span>
              </label>
              {form.acceptsDelivery && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rayon de livraison (km)</label>
                  <input
                    type="number"
                    className="input-field w-full"
                    value={form.deliveryRadiusKm}
                    onChange={(e) => update('deliveryRadiusKm', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">Coordonnées bancaires</h3>
            <p className="text-sm text-gray-500 mb-3">Pour recevoir vos paiements</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Compte Wave</label>
                <input
                  className="input-field w-full"
                  placeholder="77 XXX XX XX"
                  value={form.bankAccountWave}
                  onChange={(e) => update('bankAccountWave', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Compte Orange Money</label>
                <input
                  className="input-field w-full"
                  placeholder="77 XXX XX XX"
                  value={form.bankAccountOrange}
                  onChange={(e) => update('bankAccountOrange', e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full disabled:opacity-60"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>
    </FarmerLayout>
  )
}
