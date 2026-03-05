'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { mois: 'Jan', revenus: 285000 },
  { mois: 'Fév', revenus: 320000 },
  { mois: 'Mar', revenus: 410000 },
  { mois: 'Avr', revenus: 520000 },
  { mois: 'Mai', revenus: 680000 },
  { mois: 'Jun', revenus: 825000 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
        <p className="font-bold text-gray-900">{label}</p>
        <p className="text-green-700 font-bold">{payload[0].value.toLocaleString()} FCFA</p>
      </div>
    )
  }
  return null
}

export default function RevenueChart() {
  return (
    <div className="card h-full">
      <h3 className="font-sora font-bold text-gray-900 mb-4">📈 Revenus mensuels (FCFA)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
          <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickFormatter={v => `${v / 1000}k`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0FDF4' }} />
          <Bar dataKey="revenus" fill="#52B788" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
