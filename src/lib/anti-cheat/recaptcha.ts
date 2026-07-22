declare const grecaptcha: any

export class CAPTCHAService {
  private siteKey: string

  constructor(siteKey: string) {
    this.siteKey = siteKey
  }

  public async getActionToken(actionName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof grecaptcha === 'undefined') {
        return reject(new Error('reCAPTCHA SDK not loaded'))
      }

      grecaptcha.ready(async () => {
        try {
          const token = await grecaptcha.execute(this.siteKey, { action: actionName })
          resolve(token)
        } catch (err) {
          reject(err)
        }
      })
    })
  }
}

export async function verifyRecaptchaServerSide(token: string): Promise<number> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret) return 1.0 // Allow if not configured

  try {
    const res = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secret}&response=${token}`
    })
    
    const data = await res.json()
    if (data.success) {
      return data.score || 0
    }
    return 0
  } catch {
    return 0
  }
}
