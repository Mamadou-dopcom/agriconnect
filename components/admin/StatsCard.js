// StatsCard
export function StatsCard({ icon, value, label, color, change }) {
  const colors = {
    green: 'border-green-500 text-green-700',
    blue: 'border-blue-500 text-blue-700',
    emerald: 'border-emerald-500 text-emerald-700',
    orange: 'border-orange-500 text-orange-700',
  }
  return (
    <div className={`bg-white rounded-2xl border-l-4 p-5 shadow-sm ${colors[color]?.split(' ')[0] || 'border-gray-300'}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className={`font-sora font-black text-3xl mb-1 ${colors[color]?.split(' ')[1] || 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {change && <div className="text-xs font-semibold text-green-600 mt-1">↑ {change}</div>}
    </div>
  )
}

export default StatsCard
