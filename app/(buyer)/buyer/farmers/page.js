'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { Suspense } from 'react'

function FarmersContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [searchTimeout, setSearchTimeout] = useState(null)

  const page = parseInt(searchParams.get('page')) || 1

  const fetchFarmers = async (searchValue = '', pageNum = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchValue) params.set('search', searchValue)
      params.set('page', pageNum.toString())
      params.set('limit', '12')

      const res = await axios.get(`/api/farmers?${params.toString()}`)
      setFarmers(res.data.farmers)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error('Failed to fetch farmers:', err)
    } finally {
      setLoading(false)
    }
  }

  const searchParamsString = searchParams.toString()

  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    const currentPage = parseInt(searchParams.get('page') || '1', 10) || 1
    setSearch(currentSearch)
    fetchFarmers(currentSearch, currentPage)
  }, [searchParamsString])

  const handleSearch = (e) => {
    const value = e.target.value
    setSearch(value)

    if (searchTimeout) clearTimeout(searchTimeout)
    
    const timeout = setTimeout(() => {
      router.push(`/buyer/farmers?search=${encodeURIComponent(value)}&page=1`)
    }, 500)
    
    setSearchTimeout(timeout)
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`/buyer/farmers?${params.toString()}`)
  }

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-yellow-400">★</span>)
      } else if (i === fullStars && hasHalf) {
        stars.push(<span key={i} className="text-yellow-400">★</span>)
      } else {
        stars.push(<span key={i} className="text-gray-300">★</span>)
      }
    }
    return stars
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="bg-green-700 px-4 py-4">
        <h1 className="font-sora font-bold text-xl text-white">Nos Producteurs</h1>
        <p className="text-green-200 text-sm">Découvrez les fermiers locaux</p>
      </div>

      {/* SEARCH */}
      <div className="bg-green-700 px-4 pb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un producteur..."
            value={search}
            onChange={handleSearch}
            className="w-full px-4 py-3 pl-10 rounded-xl border-0 focus:ring-2 focus:ring-green-400 text-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
      </div>

      {/* FARMERS GRID */}
      <div className="p-4">
        <p className="text-gray-500 text-sm mb-3">{pagination.total} producteur{pagination.total !== 1 ? 's' : ''} trouvé{pagination.total !== 1 ? 's' : ''}</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
          </div>
        ) : farmers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">👨‍🌾</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucun producteur trouvé</h3>
            <p className="text-gray-400 mt-2">Essayez une autre recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {farmers.map((farmer) => {
              const farmerRating = farmer.reviewCount > 0 ? (farmer.rating || 0) : 0
              return (
              <Link
                key={farmer.id}
                href={`/buyer/farmers/${farmer.id}`}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl overflow-hidden">
                    {farmer.profileImage ? (
                      <img src={farmer.profileImage} alt={farmer.farmName} className="w-full h-full object-cover" />
                    ) : (
                      '👨‍🌾'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{farmer.farmName}</h3>
                    {farmer.location && (
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        📍 {farmer.location}
                      </p>
                    )}
                  </div>
                </div>

                {farmer.bio && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{farmer.bio}</p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    {renderStars(farmerRating)}
                    <span className="text-gray-400 text-xs ml-1">({farmer.reviewCount})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-green-700 font-bold text-sm">{farmer.productCount}</span>
                    <span className="text-gray-400 text-xs"> produit{farmer.productCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </Link>
              )
            })}
          </div>
        )}

        {/* PAGINATION */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <span className="px-4 py-2 text-gray-600">
              {page} / {pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.pages}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-4 py-2 z-50">
        <Link href="/buyer/home" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
          <span className="text-2xl">🏠</span>
          <span className="text-xs font-semibold">Accueil</span>
        </Link>
        <Link href="/buyer/farmers" className="flex flex-col items-center gap-0.5 px-4 py-1 text-green-700">
          <span className="text-2xl">👨‍🌾</span>
          <span className="text-xs font-semibold">Producteurs</span>
        </Link>
        <Link href="/buyer/cart" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
          <span className="text-2xl">🛒</span>
          <span className="text-xs font-semibold">Panier</span>
        </Link>
        <Link href="/buyer/orders" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
          <span className="text-2xl">📦</span>
          <span className="text-xs font-semibold">Commandes</span>
        </Link>
        <Link href="/buyer/profile" className="flex flex-col items-center gap-0.5 px-4 py-1 text-gray-400">
          <span className="text-2xl">👤</span>
          <span className="text-xs font-semibold">Profil</span>
        </Link>
      </nav>
    </div>
  )
}

export default function FarmersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
      </div>
    }>
      <FarmersContent />
    </Suspense>
  )
}
