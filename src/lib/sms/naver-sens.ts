import crypto from 'crypto'

/**
 * 네이버 클라우드 플랫폼 SENS SMS 발송 API
 */

export interface SensResponse {
  statusCode: string
  statusName: string
  requestId: string
  requestTime: string
}

export async function sendNaverSms(to: string, code: string): Promise<SensResponse> {
  const serviceId = process.env.NAVER_SENS_SERVICE_ID
  const accessKey = process.env.NAVER_ACCESS_KEY
  const secretKey = process.env.NAVER_SECRET_KEY
  const senderPhone = process.env.NAVER_SENDER_PHONE

  if (!serviceId || !accessKey || !secretKey || !senderPhone) {
    throw new Error('Naver SENS credentials are not configured in environment variables.')
  }

  const timestamp = Date.now().toString()
  const method = 'POST'
  const url = `/sms/v2/services/${serviceId}/messages`

  // HMAC Signature Generation
  const hmac = crypto.createHmac('sha256', secretKey)
  const space = ' '
  const newLine = '\n'
  hmac.update(method + space + url + newLine + timestamp + newLine + accessKey)
  const signature = hmac.digest('base64')

  const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-apigw-timestamp': timestamp,
      'x-ncp-iam-access-key': accessKey,
      'x-ncp-apigw-signature-v2': signature,
    },
    body: JSON.stringify({
      type: 'SMS',
      contentType: 'COMM',
      countryCode: '82',
      from: senderPhone,
      content: `[Push Stop] 본인확인 인증번호는 [${code}] 입니다. 3분 이내에 입력해주세요.`,
      messages: [{ to: to.replace(/[^0-9]/g, '') }],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Naver SENS Error: ${response.status} ${JSON.stringify(errorData)}`)
  }

  return response.json()
}
