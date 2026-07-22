import crypto from 'crypto'

const HMAC_SECRET = process.env.HMAC_SECRET || 'fallback_secret_do_not_use_in_prod'

export function generateHMAC(payload: string): string {
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex')
}

export function verifyHMAC(payload: string, signature: string): boolean {
  const expectedSignature = generateHMAC(payload)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    return false
  }
}

// Generate blind index for searching exact matches of encrypted data (like email)
export function generateBlindIndex(value: string): string {
  return crypto.createHmac('sha256', HMAC_SECRET).update(value.toLowerCase().trim()).digest('hex')
}
