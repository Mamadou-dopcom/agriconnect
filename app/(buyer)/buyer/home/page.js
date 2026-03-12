import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import BuyerLayout from '@/components/buyer/BuyerLayout'
import ProductCard from '@/components/buyer/ProductCard'
import SearchBar from '@/components/buyer/SearchBar'

async function getProducts(searchParams) {
  const category = typeof searchParams?.category === 'string' ? searchParams.category.trim() : ''
  const search = typeof searchParams?.search === 'string' ? searchParams.search.trim() : ''

  const where = {
    isAvailable: true,
    quantityAvailable: { gt: 0 },
    ...(category && {
      category: { name: { contains: category, mode: 'insensitive' } }
    }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }),
  }

  return await prisma.product.findMany({
    where,
    include: {
      category: true,
      farmer: {
        select: {
          id: true, fullName: true, city: true, region: true,
          farmerProfile: { select: { rating: true, ratingCount: true, isCertified: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}

async function getCategories() {
  return await prisma.category.findMany({ where: { isActive: true } })
}

export default async function BuyerHomePage({ searchParams }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'BUYER') redirect('/')

  const resolvedSearchParams = typeof searchParams?.then === 'function'
    ? await searchParams
    : (searchParams || {})

  const currentCategory = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : ''
  const currentSearch = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : ''

  const allProductsHref = currentSearch
    ? `/buyer/home?search=${encodeURIComponent(currentSearch)}`
    : '/buyer/home'

  const [products, categories] = await Promise.all([
    getProducts(resolvedSearchParams),
    getCategories()
  ])

  return (
    <BuyerLayout>
      {/* HEADER */}
      <div className="bg-green-700 px-6 py-6">
        <h1 className="font-sora font-bold text-2xl text-white">
          Bonjour {session.user.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-green-200 text-sm mt-1">Produits frais du Sénégal</p>
      </div>

      {/* SEARCH */}
      <div className="bg-green-700 px-6 pb-4">
        <SearchBar />
      </div>

      {/* CATEGORIES */}
      <div className="bg-white px-6 py-3 flex gap-3 overflow-x-auto scrollbar-hide border-b border-gray-100">
        <a href={allProductsHref}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            !currentCategory ? 'bg-green-100 text-green-700 border-2 border-green-400' : 'bg-gray-100 text-gray-500'
          }`}>
          🌿 Tout
        </a>
        {categories.map(cat => (
          <a
            key={cat.id}
            href={`${allProductsHref}${allProductsHref.includes('?') ? '&' : '?'}category=${encodeURIComponent(cat.name)}`}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              currentCategory === cat.name ? 'bg-green-100 text-green-700 border-2 border-green-400' : 'bg-gray-100 text-gray-500'
            }`}>
            {cat.emoji} {cat.name}
          </a>
        ))}
      </div>

      {/* PRODUCTS */}
      <div className="px-4 py-4">
        <h2 className="font-sora font-bold text-gray-900 mb-4">
          {currentCategory || (currentSearch ? `Recherche: ${currentSearch}` : 'Disponibles aujourd\'hui')}
          <span className="text-gray-400 font-normal text-sm ml-2">({products.length})</span>
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🌾</div>
            <h3 className="font-bold text-gray-700 text-lg">Aucun produit trouvé</h3>
            <p className="text-gray-400 mt-2">Essayez une autre catégorie</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </BuyerLayout>
  )
}
