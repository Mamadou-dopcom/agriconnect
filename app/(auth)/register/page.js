'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import axios from 'axios'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') || 'buyer'

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', password: '',
    confirmPassword: '', role: defaultRole, city: '', region: ''
  })
  const [loading, setLoading] = useState(false)

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      return toast.error('Les mots de passe ne correspondent pas')
    }
    if (form.password.length < 6) {
      return toast.error('Mot de passe trop court (min 6 caractères)')
    }

    setLoading(true)
    try {
      await axios.post('/api/auth/register', form)
      toast.success('Compte créé ! Connectez-vous 🎉')
      router.push('/login')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center px-4 py-10">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🌾</div>
        <h1 className="font-sora font-black text-3xl text-white">Créer un compte</h1>
        <p className="text-green-200/70 mt-1 text-sm">Rejoignez AgriConnect</p>
      </div>

      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Je suis...</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'buyer', icon: '🛒', label: 'Acheteur', desc: 'Restaurant, particulier, hôtel' },
                { key: 'farmer', icon: '👨‍🌾', label: 'Agriculteur', desc: 'Je vends mes produits' },
              ].map(r => (
                <button type="button" key={r.key}
                  onClick={() => update('role', r.key)}
                  className={`p-4 rounded-2xl border-2 text-center transition-all ${
                    form.role === r.key
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                  <div className="text-3xl mb-1">{r.icon}</div>
                  <div className={`font-bold text-sm ${form.role === r.key ? 'text-green-700' : 'text-gray-600'}`}>{r.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Nom complet *</label>
            <input className="input-field" placeholder="Ex: Mamadou Diallo"
              value={form.fullName} onChange={e => update('fullName', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Téléphone *</label>
            <input className="input-field" type="tel" placeholder="77 123 45 67"
              value={form.phone} onChange={e => update('phone', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">✉️ Email (optionnel)</label>
            <input className="input-field" type="email" placeholder="votre@email.com"
              value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🏙️ Ville</label>
            <input className="input-field" placeholder="Ex: Dakar, Thiès..."
              value={form.city} onChange={e => update('city', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Mot de passe *</label>
            <input className="input-field" type="password" placeholder="Minimum 6 caractères"
              value={form.password} onChange={e => update('password', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Confirmer le mot de passe *</label>
            <input className="input-field" type="password" placeholder="Répétez votre mot de passe"
              value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? '⏳ Création...' : `${form.role === 'farmer' ? '🌾 Créer mon compte agriculteur' : '🛒 Créer mon compte'}`}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/login" className="text-green-700 font-semibold text-sm hover:underline">
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="min-h-screen bg-green-800 flex items-center justify-center">
      <div className="text-white text-xl">Chargement...</div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegisterForm />
    </Suspense>
  )
}
