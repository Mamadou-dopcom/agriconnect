const statusConfig = {
  PENDING: { label: 'En attente', class: 'badge-pending' },
  CONFIRMED: { label: 'Confirmée', class: 'badge-confirmed' },
  PREPARING: { label: 'Préparation', class: 'badge-preparing' },
  READY: { label: 'Prête', class: 'badge-confirmed' },
  DELIVERING: { label: 'En livraison', class: 'badge-preparing' },
  DELIVERED: { label: 'Livrée', class: 'badge-delivered' },
  CANCELLED: { label: 'Annulée', class: 'badge-cancelled' },
}

export default function RecentOrders({ orders }) {
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-sora font-bold text-gray-900">Commandes récentes</h3>
        <a href="/admin/orders" className="text-green-700 text-sm font-semibold hover:underline">Tout voir →</a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['N° Commande', 'Acheteur', 'Agriculteur', 'Montant', 'Paiement', 'Statut', 'Date'].map(h => (
                <th key={h} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide py-3 px-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const status = statusConfig[order.status] || statusConfig.PENDING
              return (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-2 font-bold text-gray-900 text-sm">#{order.orderNumber}</td>
                  <td className="py-3 px-2 text-sm text-gray-600">{order.buyer.fullName}</td>
                  <td className="py-3 px-2 text-sm text-gray-600">{order.farmer.fullName}</td>
                  <td className="py-3 px-2 font-bold text-green-700 text-sm">
                    {order.totalAmount.toLocaleString()} FCFA
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-500">{order.paymentMethod || '—'}</td>
                  <td className="py-3 px-2">
                    <span className={status.class}>{status.label}</span>
                  </td>
                  <td className="py-3 px-2 text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
