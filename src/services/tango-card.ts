export class TangoCardService {
  private readonly baseUrl: string
  private readonly authHeader: string

  constructor() {
    this.baseUrl = process.env.TANGOCARD_API_URL || 'https://integration-api.tangocard.com/raas/v2'
    const platformName = process.env.TANGOCARD_PLATFORM_NAME || ''
    const platformKey = process.env.TANGOCARD_PLATFORM_KEY || ''
    const token = Buffer.from(`${platformName}:${platformKey}`).toString('base64')
    this.authHeader = `Basic ${token}`
  }

  /**
   * Place an order for a gift card
   */
  public async placeOrder(
    accountIdentifier: string,
    customerIdentifier: string,
    amount: number,
    utid: string, // Unique Tango Item ID from catalog
    email: string,
    externalRefID: string
  ): Promise<any> {
    const payload = {
      accountIdentifier,
      customerIdentifier,
      amount,
      utid,
      sendEmail: true,
      recipient: {
        email
      },
      externalRefID // Connects Tango order back to our DB GiftCardOrder ID
    }

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`TangoCard Order Failed: ${JSON.stringify(error)}`)
    }

    return response.json()
  }

  /**
   * Get the catalog of available gift cards
   */
  public async getCatalog(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/catalogs`, {
      method: 'GET',
      headers: {
        'Authorization': this.authHeader
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch TangoCard catalog')
    }

    return response.json()
  }
}

export const tangoCardService = new TangoCardService()
