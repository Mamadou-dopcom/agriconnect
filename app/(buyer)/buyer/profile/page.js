'use client'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import BuyerLayout from '@/components/buyer/BuyerLayout'

export default function BuyerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    region: '',
    address: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/buyer/profile')
      const u = res.data
      setUser(u)
      setForm({
        fullName: u.fullName || '',
        email: u.email || '',
        phone: u.phone || '',
        city: u.city || '',
        region: u.region || '',
        address: u.address || ''
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
      await axios.put('/api/buyer/profile', form)
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
      <BuyerLayout>
        <div className="p-4 text-center">Chargement...</div>
      </BuyerLayout>
    )
  }

  return (
    <BuyerLayout>
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
                  className="input-field w-full bg-gray-100"
                  value={form.phone}
                  disabled
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
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">Adresse</h3>
            
            <div className="space-y-3">
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse complète</label>
                <textarea
                  className="input-field w-full"
                  rows={2}
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
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

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full py-3 text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-colors"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </BuyerLayout>
  )
}
