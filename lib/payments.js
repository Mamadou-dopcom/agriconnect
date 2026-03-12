// ============================================
// PAYMENT INTEGRATION HELPERS
// ============================================
// This is a stub implementation. Connect to actual Wave/Orange Money APIs in production.

const WAVE_API_URL = process.env.WAVE_API_URL || 'https://api.wave.com/v1'
const ORANGE_API_URL = process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com'

export async function initiateWavePayment(amount, currency = 'XOF', metadata = {}) {
  const apiKey = process.env.WAVE_API_KEY
  
  if (!apiKey) {
    console.warn('WAVE_API_KEY not configured - payment will not work')
    return { error: 'Payment provider not configured' }
  }

  try {
    const response = await fetch(`${WAVE_API_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency,
        metadata,
        redirect_url: `${process.env.NEXTAUTH_URL}/payment/callback`
      })
    })

    const data = await response.json()
    return { success: true, ...data }
  } catch (error) {
    console.error('Wave payment error:', error)
    return { error: 'Payment initialization failed' }
  }
}

export async function initiateOrangeMoneyPayment(amount, phone, metadata = {}) {
  const apiKey = process.env.ORANGE_MONEY_API_KEY
  
  if (!apiKey) {
    console.warn('ORANGE_MONEY_API_KEY not configured - payment will not work')
    return { error: 'Payment provider not configured' }
  }

  try {
    const response = await fetch(`${ORANGE_API_URL}/payment/v1/webpayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency: 'XOF',
        buyer_phone: phone,
        metadata,
        return_url: `${process.env.NEXTAUTH_URL}/payment/callback`
      })
    })

    const data = await response.json()
    return { success: true, ...data }
  } catch (error) {
    console.error('Orange Money payment error:', error)
    return { error: 'Payment initialization failed' }
  }
}

export async function checkPaymentStatus(paymentReference, provider = 'wave') {
  const apiKey = provider === 'wave' 
    ? process.env.WAVE_API_KEY 
    : process.env.ORANGE_MONEY_API_KEY

  if (!apiKey) {
    return { error: 'Payment provider not configured' }
  }

  const baseUrl = provider === 'wave' ? WAVE_API_URL : ORANGE_API_URL

  try {
    const response = await fetch(`${baseUrl}/checkout/${paymentReference}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    const data = await response.json()
    return { success: true, ...data }
  } catch (error) {
    console.error('Payment status check error:', error)
    return { error: 'Failed to check payment status' }
  }
}

export function validatePhoneForPayment(phone, provider = 'wave') {
  const cleaned = phone.replace(/\D/g, '')
  
  if (provider === 'wave') {
    return cleaned.startsWith('77') || cleaned.startsWith('78')
  }
  
  if (provider === 'orange') {
    return cleaned.startsWith('77') || cleaned.startsWith('78') || cleaned.startsWith('70') || cleaned.startsWith('76')
  }
  
  return false
}
