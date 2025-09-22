import type { Handler } from '../misc/types'
import { handleApifyWebhook } from './handleApifyWebhook'

export const handler: Handler = async ({ req, client, logger, ctx }) => {
  const providedToken = req.headers?.['x-botpress-webhook-secret']

  const { webhookSecret } = ctx.configuration as { webhookSecret?: string }

  logger.forBot().debug(`[SECURITY CHECK] Provided Token: '${providedToken}', Configured Secret: '${webhookSecret}'`)

  if (webhookSecret && providedToken !== webhookSecret) {
    logger.forBot().warn('Webhook received with invalid or missing secret token.')
    return {
      status: 401,
      body: 'Unauthorized',
    }
  }

  if (!req.body) {
    logger.forBot().debug('Handler received an empty body, ignoring')
    return {}
  }

  try {
    const webhookPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    return await handleApifyWebhook({ webhookPayload, client, logger, ctx })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.forBot().error(`Webhook handler error: ${errorMessage}`)
    return {}
  }
}