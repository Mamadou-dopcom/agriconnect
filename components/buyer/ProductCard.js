import Link from 'next/link'

export default function ProductCard({ product }) {
  return (
    <Link href={`/buyer/products/${product.id}`}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow block">
      <div className="h-24 bg-green-50 flex items-center justify-center text-5xl">
        {product.category?.emoji || '🌿'}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm truncate">{product.name}</h3>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          👨‍🌾 {product.farmer.fullName} · {product.farmer.city}
        </p>
        {product.farmer.farmerProfile?.rating > 0 && (
          <p className="text-xs text-yellow-500 mt-0.5">
            ⭐ {product.farmer.farmerProfile.rating.toFixed(1)}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="font-black text-green-700 text-sm">
            {product.pricePerUnit.toLocaleString()} F
            <span className="text-xs font-normal text-gray-400">/{product.unit}</span>
          </span>
          {product.isOrganic && (
            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">🌱 Bio</span>
          )}
        </div>
      </div>
    </Link>
  )
}
