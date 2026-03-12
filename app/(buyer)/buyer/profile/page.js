'use client'
import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import BuyerLayout from '@/components/buyer/BuyerLayout'

export default function BuyerProfilePage() {
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
      setAvatarUrl(u.avatarUrl || '')
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
      await updateSession({ ...session, user: { ...session.user, name: form.fullName } })
      toast.success('Profil mis à jour !')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpdate = async () => {
    if (!avatarUrl.trim()) return
    setUpdatingAvatar(true)
    try {
      await axios.put('/api/user/avatar', { avatarUrl: avatarUrl.trim() })
      await updateSession({ ...session, user: { ...session.user, image: avatarUrl.trim() } })
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
      <BuyerLayout>
        <div className="p-4 text-center">Chargement...</div>
      </BuyerLayout>
    )
  }

  return (
    <BuyerLayout>
      <div className="p-4">
        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Mon profil</h1>

        {/* AVATAR SECTION */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <h3 className="font-bold text-gray-900 mb-3">Photo de profil</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                '👤'
              )}
            </div>
            <div className="flex-1">
              <input
                type="url"
                placeholder="URL de votre photo de profil..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="input-field w-full text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Collez l'URL d'une image (ex: depuis Google Photos)</p>
            </div>
            <button
              type="button"
              onClick={handleAvatarUpdate}
              disabled={updatingAvatar || !avatarUrl.trim()}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {updatingAvatar ? '...' : 'OK'}
            </button>
          </div>
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
                  onChange={(e) => updateForm('email', e.target.value)}
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse complète</label>
                <textarea
                  className="input-field w-full"
                  rows={2}
                  value={form.address}
                  onChange={(e) => updateForm('address', e.target.value)}
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

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </BuyerLayout>
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
