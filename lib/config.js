function getIntFromEnv(name, fallback) {
  const parsed = parseInt(process.env[name], 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

export const config = {
  deliveryFee: getIntFromEnv('DEFAULT_DELIVERY_FEE', 700),
  minDeliveryFee: getIntFromEnv('MIN_DELIVERY_FEE', 0),
  maxDeliveryFee: getIntFromEnv('MAX_DELIVERY_FEE', 50000),
  platformCommissionPercent: getIntFromEnv('PLATFORM_COMMISSION_PERCENT', 10),
  pendingPaymentExpiryMinutes: getIntFromEnv('PENDING_PAYMENT_EXPIRY_MINUTES', 15),
}
