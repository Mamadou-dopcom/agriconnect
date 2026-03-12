// ============================================
// BUYER LAYOUT
// ============================================
'use client'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

export default function BuyerLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)

  const fetchCartCount = useCallback(async () => {
    try {
      const res = await axios.get('/api/cart', { 
        timeout: 3000 
      })
      setCartCount(res.data.length || 0)
    } catch (err) {
      // ignore - user may not be logged in
    }
  }, [])

  useEffect(() => {
    fetchCartCount()
  }, [fetchCartCount])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCartCount()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchCartCount])

  const navItems = [
    { href: '/buyer/home', icon: '🏠', label: 'Accueil' },
    { href: '/buyer/farmers', icon: '👨‍🌾', label: 'Producteurs' },
    { href: '/buyer/cart', icon: '🛒', label: 'Panier', badge: cartCount },
    { href: '/buyer/orders', icon: '📦', label: 'Commandes' },
    { href: '/buyer/profile', icon: '👤', label: 'Profil' },
  ]
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-4 py-2 z-50">
        {navItems.map(item => (
          <Link key={item.href} href={item.href}
            className={`relative flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${
              pathname === item.href ? 'text-green-700' : 'text-gray-400'
            }`}>
            <span className="text-2xl">{item.icon}</span>
            {item.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            <span className="text-xs font-semibold">{item.label}</span>
            {pathname === item.href && <div className="w-1 h-1 rounded-full bg-green-700" />}
          </Link>
        ))}
      </nav>
    </div>
  )
}
