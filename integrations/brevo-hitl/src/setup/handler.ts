import * as bp from '.botpress'
import { handleConversationCompleted } from 'src/events/handleConversationCompleted'
import { handleOperatorReplied } from 'src/events/handleOperatorReplied'

export const handler: bp.IntegrationProps['handler'] = async ({ ctx, req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received a request with no body.')
    return
  }

  logger.forBot().debug('Handler received request from Brevo with raw payload:', req.body)

  let brevoEventPayload: any
  try {
    // Ensure req.body is a string before parsing
    if (typeof req.body !== 'string') {
      logger.forBot().error('Handler received a non-string body. Type:', typeof req.body)
      return
    }
    brevoEventPayload = JSON.parse(req.body)
    logger.forBot().info('Conversation ID from Brevo:', brevoEventPayload.conversationId)
  } catch (error: any) {
    logger.forBot().error('Failed to parse Brevo event JSON from request body:', error.message ? error.message : error, 'Raw body:', req.body)
    return
  }

  const eventType = brevoEventPayload.eventName

  if (!eventType) {
    logger.forBot().warn('Handler received a parsed Brevo event, but it has no eventName property. Payload:', brevoEventPayload)
    return
  }

  logger.forBot().info(`Handler: Processing Brevo event type: ${eventType} for conversation: ${brevoEventPayload.conversationId || 'N/A'}`)

  switch (eventType) {
    case 'conversationFragment':
      await handleOperatorReplied({ brevoEvent: brevoEventPayload, client })
      break
    case 'conversationTranscript':
      await handleConversationCompleted({ brevoEvent: brevoEventPayload, client })
      break
    default:
      logger.forBot().warn(`Handler: Unhandled Brevo event type: ${eventType}. Payload:`, brevoEventPayload)
  }
}