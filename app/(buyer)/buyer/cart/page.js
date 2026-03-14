'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import BuyerLayout from '@/components/buyer/BuyerLayout'
import CartItemComponent from '@/components/buyer/CartItem'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [feesConfig, setFeesConfig] = useState({ deliveryFee: 700, platformCommissionPercent: 10 })

  const uniqueFarmerIds = Array.from(new Set(cart.map((item) => item.product?.farmerId).filter(Boolean)))
  const hasMultipleFarmers = uniqueFarmerIds.length > 1
  const ordersCount = uniqueFarmerIds.length || 0

  const fetchCart = async () => {
    try {
      const [cartRes, configRes] = await Promise.all([
        axios.get('/api/cart'),
        axios.get('/api/config')
      ])
      setCart(cartRes.data)
      setFeesConfig({
        deliveryFee: configRes.data?.deliveryFee || 700,
        platformCommissionPercent: configRes.data?.platformCommissionPercent || 10
      })
    } catch (err) {
      toast.error('Erreur lors du chargement du panier')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
  }, [])

  const handleCheckout = async () => {
    if (cart.length === 0) return
    
    setCheckoutLoading(true)
    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))

      const res = await axios.post('/api/orders', {
        items,
        deliveryAddress: null,
        paymentMethod
      })

      if (res.data?.payment?.checkoutUrl) {
        toast.success('Redirection vers le paiement...')
        window.location.href = res.data.payment.checkoutUrl
        return
      }

      const createdOrders = Array.isArray(res.data?.orders) ? res.data.orders : []
      if (createdOrders.length > 1) {
        toast.success(`${createdOrders.length} commandes créées avec succès !`)
        router.push('/buyer/orders')
        return
      }

      toast.success('Commande passée avec succès !')
      router.push(`/buyer/orders/${res.data.order.id}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la commande')
    } finally {
      setCheckoutLoading(false)
    }
  }

  useEffect(() => {
    if (hasMultipleFarmers && paymentMethod !== 'CASH') {
      setPaymentMethod('CASH')
    }
  }, [hasMultipleFarmers, paymentMethod])

  const subtotalByFarmer = cart.reduce((acc, item) => {
    const farmerId = item.product?.farmerId
    if (!farmerId) return acc
    acc[farmerId] = (acc[farmerId] || 0) + (item.product.pricePerUnit * item.quantity)
    return acc
  }, {})

  const subtotal = Object.values(subtotalByFarmer).reduce((sum, farmerSubtotal) => sum + farmerSubtotal, 0)
  const deliveryFee = ordersCount > 0 ? (feesConfig.deliveryFee * ordersCount) : 0
  const commission = Object.values(subtotalByFarmer).reduce((sum, farmerSubtotal) => {
    return sum + Math.round(farmerSubtotal * (feesConfig.platformCommissionPercent / 100))
  }, 0)
  const total = subtotal + deliveryFee + commission

  if (loading) {
    return (
      <BuyerLayout>
        <div className="p-6 text-center">Chargement...</div>
      </BuyerLayout>
    )
  }

  return (
    <BuyerLayout>
      <div className="p-4">
        <h1 className="font-sora font-bold text-xl text-gray-900 mb-4">Mon panier</h1>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🛒</div>
            <h3 className="font-bold text-gray-700 text-lg">Votre panier est vide</h3>
            <p className="text-gray-400 mt-2">Découvrez nos produits frais</p>
            <Link href="/buyer/home" className="btn-primary mt-6 inline-block">
              Voir les produits
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map(item => (
              <CartItemComponent
                key={item.id}
                item={item}
                onUpdate={fetchCart}
                onRemove={fetchCart}
              />
            ))}

            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">Mode de paiement</h3>
              {hasMultipleFarmers && (
                <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm">
                  Votre panier contient plusieurs producteurs. Le paiement en ligne multi-producteurs n'est pas encore disponible.
                </div>
              )}
              <div className="space-y-2">
                {[
                  { key: 'CASH', icon: '💵', label: 'Espèces à la livraison' },
                  { key: 'WAVE', icon: '📱', label: 'Wave' },
                  { key: 'ORANGE_MONEY', icon: '🟠', label: 'Orange Money' },
                ].map(pm => (
                  <label key={pm.key} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value={pm.key}
                      checked={paymentMethod === pm.key}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      disabled={hasMultipleFarmers && pm.key !== 'CASH'}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-xl">{pm.icon}</span>
                    <span className={`font-medium ${hasMultipleFarmers && pm.key !== 'CASH' ? 'text-gray-400' : ''}`}>
                      {pm.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sous-total ({cart.length} article{cart.length > 1 ? 's' : ''})</span>
                  <span>{subtotal.toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Frais de livraison</span>
                  <span>{deliveryFee.toLocaleString()} XOF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Commission plateforme</span>
                  <span>{commission.toLocaleString()} XOF</span>
                </div>
                {hasMultipleFarmers && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                    Le panier sera split en {ordersCount} commandes, avec frais et commission par producteur.
                  </p>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-700">{total.toLocaleString()} XOF</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="btn-primary w-full mt-4 disabled:opacity-60"
            >
              {checkoutLoading ? '⏳ Traitement...' : `Commander (${total.toLocaleString()} XOF)`}
            </button>
          </div>
        )}
      </div>
    </BuyerLayout>
  )
}
