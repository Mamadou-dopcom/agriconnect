'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function FarmerLayout({ children }) {
  const pathname = usePathname()
  const navItems = [
    { href: '/farmer/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/farmer/products', icon: '🌿', label: 'Produits' },
    { href: '/farmer/orders', icon: '📦', label: 'Commandes' },
    { href: '/farmer/profile', icon: '👤', label: 'Profil' },
  ]
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-4 py-2 z-50">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
              pathname === item.href ? 'text-green-700' : 'text-gray-400'
            }`}>
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-semibold">{item.label}</span>
            {pathname === item.href && <div className="w-1 h-1 rounded-full bg-green-700" />}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default FarmerLayout
