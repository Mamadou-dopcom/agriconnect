'use client'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin/dashboard', icon: '📊', label: 'Tableau de bord' },
  { href: '/admin/orders', icon: '📦', label: 'Commandes' },
  { href: '/admin/farmers', icon: '👨‍🌾', label: 'Agriculteurs' },
  { href: '/admin/buyers', icon: '🛒', label: 'Acheteurs' },
  { href: '/admin/products', icon: '🌿', label: 'Produits' },
  { href: '/admin/payments', icon: '💰', label: 'Paiements' },
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <aside className="w-60 bg-green-950 flex flex-col fixed top-0 left-0 bottom-0 z-40">
        <div className="p-6 border-b border-white/10">
          <div className="font-sora font-black text-xl text-white">
            🌾 Agri<span className="text-green-400">Connect</span>
          </div>
          <div className="text-xs text-white/40 mt-1">Administration</div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-xs font-bold text-white/30 uppercase tracking-widest px-3 py-2">Principal</div>
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 w-full transition-colors">
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ml-60 flex-1 min-h-screen">
        {/* TOPBAR */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
          <div className="font-sora font-bold text-gray-900 text-lg">
            {navItems.find(n => n.href === pathname)?.label || 'Admin'}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              🗓️ {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
              👑 Admin
            </span>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
