import * as crypto from 'crypto'
import * as bp from '.botpress'

/**
 * Validates the HubSpot webhook signature
 * @param requestBody - The raw request body as a string
 * @param signature - The X-HubSpot-Signature-V3 header value
 * @param timestamp - The X-HubSpot-Request-Timestamp header value
 * @param method - The HTTP method
 * @param webhookUrl - The webhook URL that HubSpot is configured to send to
 * @param clientSecret - The HubSpot client secret
 * @param logger - Botpress logger
 * @returns boolean indicating if the signature is valid
 */
export function validateHubSpotSignature(
  requestBody: string,
  signature: string,
  timestamp: string,
  method: string,
  webhookUrl: string,
  clientSecret: string,
  logger: bp.Logger
): boolean {
  if (!signature || !clientSecret || !timestamp) {
    logger.forBot().error('Missing required headers or client secret')
    return false
  }

  // Validate timestamp (5 minutes in milliseconds)
  const MAX_ALLOWED_TIMESTAMP = 300000
  const currentTime = Date.now()
  const timestampDiff = currentTime - parseInt(timestamp)
  
  if (timestampDiff > MAX_ALLOWED_TIMESTAMP) {
    logger.forBot().error('Timestamp is too old:', timestampDiff, 'ms')
    return false
  }

  // Concatenate request method, webhook URL, body, and header timestamp
  const rawString = `${method}${webhookUrl}${requestBody}${timestamp}`

  // Create HMAC SHA-256 hash from resulting string, then base64-encode it
  const hmac = crypto.createHmac('sha256', clientSecret)
  hmac.update(rawString)
  const computedSignature = hmac.digest('base64')

  // Compare signatures using timing-safe comparison
  const isValid = crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(signature)
  )
  
  if (!isValid) {
    logger.forBot().error('Invalid HubSpot webhook signature')
  }
  
  return isValid
} 