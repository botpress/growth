import { apifyWebhookSchema } from '../misc/schemas'
import { handleCrawlerCompleted } from './handleCrawlerCompleted'
import * as bp from '.botpress'

export async function handleApifyWebhook({ webhookPayload, client, logger, ctx }: { 
  webhookPayload: any, 
  client: bp.Client, 
  logger: bp.Logger, 
  ctx: bp.Context 
}) {
  logger.forBot().debug('Received webhook payload:', webhookPayload)

  const validationResult = apifyWebhookSchema.safeParse(webhookPayload)
  
  if (!validationResult.success) {
    logger.forBot().debug('Webhook payload does not match expected schema, ignoring')
    return {}
  }

  const validatedPayload = validationResult.data

  const eventType = validatedPayload.eventType
  const runId = validatedPayload.resource.id

  if (!eventType) {
    logger.forBot().debug('Webhook payload missing eventType, ignoring')
    return {}
  }

  switch (eventType) {
    case 'ACTOR.RUN.SUCCEEDED':
      logger.forBot().info(`Processing Apify webhook event: ${eventType}`)
      await handleCrawlerCompleted({ webhookPayload: validatedPayload, client, logger, ctx })
      break
    
    case 'ACTOR.RUN.FAILED':
      logger.forBot().warn(`Received webhook for failed crawler run: ${runId}`)
      break
    
    case 'ACTOR.RUN.ABORTED':
      logger.forBot().warn(`Received webhook for aborted crawler run: ${runId}`)
      break
    
    case 'ACTOR.RUN.TIMED_OUT':
      logger.forBot().warn(`Received webhook for timed out crawler run: ${runId}`)
      break
    
    case 'ACTOR.RUN.CREATED':
      logger.forBot().info(`Received webhook for created crawler run: ${runId}`)
      break
    
    case 'ACTOR.RUN.RESURRECTED':
      logger.forBot().info(`Received webhook for resurrected crawler run: ${runId}`)
      break
    
    default:
      logger.forBot().info(`Received webhook for unhandled event type: ${eventType}`)
  }

  return {}
}
