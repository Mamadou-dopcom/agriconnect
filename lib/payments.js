import crypto from 'crypto'

const WAVE_API_URL = process.env.WAVE_API_URL || 'https://api.wave.com/v1'
const ORANGE_API_URL = process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com'

function normalizeProvider(provider) {
  const value = String(provider || '').toLowerCase()
  if (value === 'orange' || value === 'orange_money' || value === 'orange-money') return 'orange'
  return 'wave'
}

export function inferProviderFromHeaders(headers) {
  if (headers.get('x-orange-signature')) return 'orange'
  if (headers.get('x-wave-signature')) return 'wave'
  return null
}

function normalizeStatus(value) {
  const status = String(value || '').toLowerCase()
  if (['completed', 'success', 'paid', 'succeeded', 'successful'].includes(status)) return 'completed'
  if (['failed', 'cancelled', 'canceled', 'declined', 'error'].includes(status)) return 'failed'
  return 'pending'
}

function safeCompareSignature(incoming, expected) {
  if (!incoming || !expected) return false

  const normalizedIncoming = incoming.includes('=') ? incoming.split('=').pop() : incoming
  const a = Buffer.from(normalizedIncoming)
  const b = Buffer.from(expected)

  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export function verifyWebhookSignature({ headers, rawBody, provider }) {
  const normalizedProvider = normalizeProvider(provider)
  const secret = normalizedProvider === 'orange'
    ? process.env.ORANGE_WEBHOOK_SECRET
    : process.env.WAVE_WEBHOOK_SECRET

  if (!secret) {
    console.warn(`Missing ${normalizedProvider.toUpperCase()} webhook secret`)
    return false
  }

  const signatureCandidates = normalizedProvider === 'orange'
    ? [
        headers.get('x-orange-signature'),
        headers.get('x-webhook-signature'),
        headers.get('x-signature')
      ]
    : [
        headers.get('x-wave-signature'),
        headers.get('x-webhook-signature'),
        headers.get('x-signature')
      ]

  const signature = signatureCandidates.find(Boolean)
  if (!signature) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')

  return safeCompareSignature(signature, expected)
}

export function extractPaymentReference(payload) {
  return payload?.reference || payload?.paymentReference || payload?.payment_reference || payload?.transaction_id || payload?.checkout_id || null
}

export function extractProvider(payload) {
  const raw = payload?.provider || payload?.metadata?.provider || payload?.payment_method || payload?.method
  return normalizeProvider(raw)
}

export function extractNormalizedStatus(payload) {
  return normalizeStatus(payload?.status || payload?.payment_status || payload?.event)
}

export async function initiateWavePayment(amount, currency = 'XOF', metadata = {}) {
  const apiKey = process.env.WAVE_API_KEY
  if (!apiKey) {
    return { error: 'WAVE provider not configured' }
  }

  try {
    const response = await fetch(`${WAVE_API_URL}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency,
        metadata,
        success_url: `${process.env.NEXTAUTH_URL}/buyer/orders`,
        error_url: `${process.env.NEXTAUTH_URL}/buyer/cart`,
        webhook_url: `${process.env.NEXTAUTH_URL}/api/payments/webhook`
      })
    })

    const data = await response.json()
    if (!response.ok) {
      return { error: data?.message || 'Wave payment initialization failed' }
    }

    return {
      success: true,
      provider: 'wave',
      reference: extractPaymentReference(data),
      checkoutUrl: data?.checkout_url || data?.payment_url || null,
      raw: data
    }
  } catch (error) {
    console.error('Wave payment error:', error)
    return { error: 'Wave payment initialization failed' }
  }
}

export async function initiateOrangeMoneyPayment(amount, phone, metadata = {}) {
  const apiKey = process.env.ORANGE_MONEY_API_KEY
  if (!apiKey) {
    return { error: 'Orange Money provider not configured' }
  }

  try {
    const response = await fetch(`${ORANGE_API_URL}/payment/v1/webpayment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency: 'XOF',
        buyer_phone: phone,
        metadata,
        return_url: `${process.env.NEXTAUTH_URL}/buyer/orders`,
        cancel_url: `${process.env.NEXTAUTH_URL}/buyer/cart`,
        notif_url: `${process.env.NEXTAUTH_URL}/api/payments/webhook`
      })
    })

    const data = await response.json()
    if (!response.ok) {
      return { error: data?.message || 'Orange Money payment initialization failed' }
    }

    return {
      success: true,
      provider: 'orange',
      reference: extractPaymentReference(data),
      checkoutUrl: data?.payment_url || data?.redirect_url || null,
      raw: data
    }
  } catch (error) {
    console.error('Orange Money payment error:', error)
    return { error: 'Orange Money payment initialization failed' }
  }
}

export async function checkPaymentStatus(paymentReference, provider = 'wave') {
  const normalizedProvider = normalizeProvider(provider)
  const apiKey = normalizedProvider === 'orange'
    ? process.env.ORANGE_MONEY_API_KEY
    : process.env.WAVE_API_KEY

  if (!apiKey) {
    return { error: 'Payment provider not configured' }
  }

  const statusUrl = normalizedProvider === 'orange'
    ? `${ORANGE_API_URL}/payment/v1/transactions/${paymentReference}`
    : `${WAVE_API_URL}/checkout/sessions/${paymentReference}`

  try {
    const response = await fetch(statusUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    if (!response.ok) {
      return { error: data?.message || 'Failed to check payment status' }
    }

    return {
      success: true,
      provider: normalizedProvider,
      status: extractNormalizedStatus(data),
      reference: extractPaymentReference(data) || paymentReference,
      raw: data
    }
  } catch (error) {
    console.error('Payment status check error:', error)
    return { error: 'Failed to check payment status' }
  }
}

export function validatePhoneForPayment(phone, provider = 'wave') {
  const cleaned = String(phone || '').replace(/\D/g, '')
  const normalizedProvider = normalizeProvider(provider)

  if (normalizedProvider === 'wave') {
    return cleaned.startsWith('77') || cleaned.startsWith('78')
  }

  return cleaned.startsWith('77') || cleaned.startsWith('78') || cleaned.startsWith('70') || cleaned.startsWith('76')
}
