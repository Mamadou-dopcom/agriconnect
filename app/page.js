import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // Rediriger selon le rôle
  if (session?.user?.role === 'FARMER') redirect('/farmer/dashboard')
  if (session?.user?.role === 'BUYER') redirect('/buyer/home')
  if (session?.user?.role === 'ADMIN') redirect('/admin/dashboard')

  return (
    <main className="min-h-screen bg-[#0A1A0F]">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="text-white font-sora font-black text-2xl">🌾 AgriConnect</div>
        <div className="flex gap-4">
          <Link href="/login" className="text-white/70 hover:text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium">
            Connexion
          </Link>
          <Link href="/register" className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors">
            S'inscrire
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 pt-20 pb-32 max-w-4xl mx-auto">
        <div className="inline-block bg-green-900/30 border border-green-700/30 text-green-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-8">
          🇸🇳 Made for Sénégal
        </div>
        <h1 className="font-sora font-black text-6xl md:text-8xl text-white mb-6 leading-none">
          Agri<span className="text-green-400">Connect</span>
        </h1>
        <p className="text-white/60 text-xl mb-12 max-w-2xl mx-auto">
          De la ferme à votre table — sans intermédiaires.<br />
          Les agriculteurs gagnent plus. Les acheteurs paient moins.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register?role=buyer"
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:scale-105">
            🛒 Je suis acheteur
          </Link>
          <Link href="/register?role=farmer"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-8 py-4 rounded-2xl text-lg transition-all hover:scale-105">
            👨‍🌾 Je suis agriculteur
          </Link>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-green-800 py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '60%', label: 'de la population sénégalaise dans l\'agriculture' },
            { value: '7M+', label: 'utilisateurs Wave au Sénégal' },
            { value: '0', label: 'concurrent direct sérieux' },
            { value: '15%', label: 'du PIB sénégalais' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="font-sora font-black text-5xl text-white mb-2">{stat.value}</div>
              <div className="text-green-200/70 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="font-sora font-black text-4xl text-white text-center mb-16">
          Pourquoi AgriConnect ?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '💰', title: 'Agriculteurs gagnent plus', desc: 'Plus d\'intermédiaires. L\'agriculteur vend directement et est payé via Wave immédiatement.' },
            { icon: '🛒', title: 'Acheteurs paient moins', desc: 'Restaurants, hôtels et particuliers accèdent à des produits frais à prix juste.' },
            { icon: '📱', title: 'Simple à utiliser', desc: 'Interface pensée pour le Sénégal. Paiement Wave, Orange Money ou cash.' },
            { icon: '📡', title: 'Fonctionne partout', desc: 'Optimisé pour les connexions lentes. Accessible depuis n\'importe quel téléphone.' },
            { icon: '⭐', title: 'Système de confiance', desc: 'Avis vérifiés et profils certifiés pour sécuriser chaque transaction.' },
            { icon: '🚴', title: 'Livraison intégrée', desc: 'Réseau de livreurs partenaires. De la ferme à votre porte en 24h.' },
          ].map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-sora font-bold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-24 px-6">
        <h2 className="font-sora font-black text-4xl text-white mb-6">Prêt à rejoindre AgriConnect ?</h2>
        <p className="text-white/50 mb-10">Rejoignez les agriculteurs et acheteurs qui font confiance à AgriConnect</p>
        <Link href="/register"
          className="inline-block bg-green-600 hover:bg-green-500 text-white font-bold px-10 py-5 rounded-2xl text-xl transition-all hover:scale-105">
          Créer un compte gratuit 🌾
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm">
        🌾 AgriConnect · De la ferme à votre table · Sénégal 🇸🇳
      </footer>
    </main>
  )
}
