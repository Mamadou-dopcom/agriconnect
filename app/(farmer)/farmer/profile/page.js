'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import FarmerLayout from '@/components/farmer/FarmerLayout'
import AvatarUploader from '@/components/AvatarUploader'

export default function FarmerProfilePage() {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [updatingAvatar, setUpdatingAvatar] = useState(false)

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
      setAvatarUrl(u.avatarUrl || '')
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
      await updateSession({ ...session, user: { ...session.user, name: form.fullName } })
      toast.success('Profil mis à jour !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpdate = async () => {
    setUpdatingAvatar(true)
    try {
      await axios.put('/api/user/avatar', { avatarUrl: avatarUrl || null })
      toast.success('Photo de profil mise à jour !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setUpdatingAvatar(false)
    }
  }

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

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

        {/* AVATAR SECTION */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <h3 className="font-bold text-gray-900 mb-3">Photo de profil</h3>
          <AvatarUploader value={avatarUrl} onChange={setAvatarUrl} placeholder="👨‍🌾" />
          <button
            type="button"
            onClick={handleAvatarUpdate}
            disabled={updatingAvatar}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 mt-3"
          >
            {updatingAvatar ? '...' : 'Enregistrer la photo'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">Informations personnelles</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom complet</label>
                <input
                  className="input-field w-full"
                  value={form.fullName}
                  onChange={(e) => updateForm('fullName', e.target.value)}
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
                  onChange={(e) => updateForm('email', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ville</label>
                  <input
                    className="input-field w-full"
                    value={form.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Région</label>
                  <input
                    className="input-field w-full"
                    value={form.region}
                    onChange={(e) => updateForm('region', e.target.value)}
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
                  onChange={(e) => updateForm('farmName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  className="input-field w-full"
                  rows={3}
                  value={form.farmDescription}
                  onChange={(e) => updateForm('farmDescription', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Taille (hectares)</label>
                  <input
                    type="number"
                    className="input-field w-full"
                    value={form.farmSizeHectares}
                    onChange={(e) => updateForm('farmSizeHectares', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Années d'expérience</label>
                  <input
                    type="number"
                    className="input-field w-full"
                    value={form.yearsExperience}
                    onChange={(e) => updateForm('yearsExperience', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Spécialités (séparées par virgule)</label>
                <input
                  className="input-field w-full"
                  placeholder="Légumes, Tomates, Oignons..."
                  value={form.specialties}
                  onChange={(e) => updateForm('specialties', e.target.value)}
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
                  onChange={(e) => updateForm('acceptsDelivery', e.target.checked)}
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
                    onChange={(e) => updateForm('deliveryRadiusKm', e.target.value)}
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
                  onChange={(e) => updateForm('bankAccountWave', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Compte Orange Money</label>
                <input
                  className="input-field w-full"
                  placeholder="77 XXX XX XX"
                  value={form.bankAccountOrange}
                  onChange={(e) => updateForm('bankAccountOrange', e.target.value)}
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
            onClick={() => setShowPasswordModal(true)}
            className="w-full py-3 text-green-700 font-semibold hover:bg-green-50 rounded-xl transition-colors"
          >
            Changer le mot de passe
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

      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </FarmerLayout>
  )
}

function PasswordModal({ onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setSaving(true)
    try {
      await axios.put('/api/user/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      toast.success('Mot de passe modifié !')
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-lg mb-4">Changer le mot de passe</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe actuel</label>
            <input
              type="password"
              className="input-field w-full"
              value={form.currentPassword}
              onChange={(e) => setForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              className="input-field w-full"
              value={form.newPassword}
              onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmer le mot de passe</label>
            <input
              type="password"
              className="input-field w-full"
              value={form.confirmPassword}
              onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary disabled:opacity-50">
              {saving ? '...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
