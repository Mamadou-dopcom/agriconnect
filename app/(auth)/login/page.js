'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        phone: form.phone,
        password: form.password,
        redirect: false,
      })

      if (res?.error) {
        toast.error('Numéro ou mot de passe incorrect')
      } else {
        toast.success('Connexion réussie !')
        // Redirection selon le rôle (gérée par le middleware)
        router.refresh()
        router.push('/')
      }
    } catch (err) {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center px-4">
      {/* LOGO */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">🌾</div>
        <h1 className="font-sora font-black text-4xl text-white">AgriConnect</h1>
        <p className="text-green-200/70 mt-1">De la ferme à votre table</p>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="font-sora font-bold text-2xl text-gray-900 mb-1">Connexion</h2>
        <p className="text-gray-500 text-sm mb-6">Entrez vos identifiants pour continuer</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Numéro de téléphone</label>
            <input
              type="tel"
              className="input-field"
              placeholder="Ex: 77 123 45 67"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Mot de passe</label>
            <input
              type="password"
              className="input-field"
              placeholder="Votre mot de passe"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full mt-2 disabled:opacity-60">
            {loading ? '⏳ Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-xs">ou</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <Link href="/register" className="btn-secondary w-full text-center block">
          Créer un compte
        </Link>

        {/* COMPTES DE TEST */}
        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
          <p className="text-xs font-bold text-green-700 mb-2">🧪 Comptes de test :</p>
          <div className="space-y-1 text-xs text-green-600">
            <p>👑 Admin : <span className="font-mono">338200000</span></p>
            <p>👨‍🌾 Agriculteur : <span className="font-mono">771234567</span></p>
            <p>🛒 Acheteur : <span className="font-mono">778901234</span></p>
            <p>🔑 Mot de passe : <span className="font-mono">agriconnect123</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
