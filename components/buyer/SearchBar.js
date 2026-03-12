'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  useEffect(() => {
    setSearch(searchParams.get('search') || '')
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) params.set('search', search.trim())
    else params.delete('search')

    const query = params.toString()
    router.push(query ? `/buyer/home?${query}` : '/buyer/home')
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Chercher tomates, mangues, oignons..."
        className="flex-1 bg-white rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none"
      />
      <button type="submit"
        className="bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors">
        🔍
      </button>
    </form>
  )
}
