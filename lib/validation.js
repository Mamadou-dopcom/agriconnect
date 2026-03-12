export function sanitizeInput(input) {
  if (typeof input !== 'string') return ''
  return input.trim().slice(0, 5000)
}

export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone) {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 8 && cleaned.length <= 15
}

export function validateQuantity(quantity) {
  const qty = parseInt(quantity)
  return !isNaN(qty) && qty > 0 && qty <= 10000
}

export function sanitizeErrorMessage(message) {
  if (typeof message !== 'string') return 'Une erreur est survenue'
  const sanitized = message.replace(/[<>]/g, '')
  return sanitized.slice(0, 200)
}
