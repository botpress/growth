import * as bp from '.botpress'
import { handleIncomingMessage } from 'src/events/incomingMessage'
import { handleChatDeactivated } from 'src/events/chatDeactivated'
import { handleChatTransferred } from 'src/events/chatTransferred'
import { 
  liveChatWebhookPayloadSchema,
  LiveChatTransferred
} from 'src/definitions/livechatEvents'

export const handler: bp.IntegrationProps['handler'] = async ({ ctx, req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  let rawPayload: unknown
  try {
    rawPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    logger.forBot().debug('Raw webhook payload:', JSON.stringify(rawPayload, null, 2))
  } catch (err) {
    logger.forBot().error('Failed to parse request body:', err)
    return
  }

  // Validate webhook payload using Zod schema
  const validationResult = liveChatWebhookPayloadSchema.safeParse(rawPayload)
  if (!validationResult.success) {
    logger.forBot().error('Invalid webhook payload:', {
      error: validationResult.error,
      receivedPayload: rawPayload
    })
    return
  }

  const webhookPayload = validationResult.data

  // Verify webhook secret
  const secret_key = webhookPayload.secret_key
  if (secret_key !== ctx.configuration.webhookSecret) {
    logger.forBot().error('Invalid webhook secret', {
      received_secret: secret_key,
      expected_secret: ctx.configuration.webhookSecret,
    })
    return
  }
  logger.forBot().info('Webhook secret verified')

  const { action, payload: eventPayload, webhook_id, organization_id, additional_data } = webhookPayload

  logger.forBot().info(`Received LiveChat webhook event: ${action}`, {
    webhook_id,
    organization_id,
    action,
    chat_id: eventPayload.chat_id,
    thread_id: eventPayload.thread_id,
    additional_data: {
      has_chat_properties: !!additional_data?.chat_properties,
      presence_users: additional_data?.chat_presence_user_ids?.length || 0,
    },
  })

  // Handle different event types
  switch (action) {
    case 'incoming_event': {
      if (!('event' in eventPayload)) {
        logger.forBot().warn('Received incoming_event without event data', {
          webhook_id,
          organization_id,
          payload: eventPayload,
        })
        return
      }

      switch (eventPayload.event.type) {
        case 'message':
          logger.forBot().info('Processing incoming message event', {
            chat_id: eventPayload.chat_id,
            thread_id: eventPayload.thread_id,
            event: eventPayload.event,
            additional_data,
          })
          await handleIncomingMessage(eventPayload, logger, client)
          break

        default:
          logger.forBot().info('Received incoming_event with unhandled event type', {
            event_type: eventPayload.event.type,
            chat_id: eventPayload.chat_id,
            thread_id: eventPayload.thread_id,
            additional_data,
          })
      }
      break
    }

    case 'chat_deactivated': {
      logger.forBot().info('Processing chat deactivated event', {
        chat_id: eventPayload.chat_id,
        thread_id: eventPayload.thread_id,
        additional_data,
      })
      await handleChatDeactivated(eventPayload, logger, client)
      break
    }

    case 'chat_transferred': {
      const transferredPayload = eventPayload as LiveChatTransferred
      
      logger.forBot().info('Processing chat transferred event', {
        chat_id: transferredPayload.chat_id,
        thread_id: transferredPayload.thread_id,
        transferred_to: transferredPayload.transferred_to,
        additional_data,
      })
      
      await handleChatTransferred(transferredPayload, logger, client)
      break
    }

    default:
      logger.forBot().warn(`Unhandled LiveChat event type: ${action}`, {
        action,
        webhook_id,
        organization_id,
        payload: eventPayload,
        additional_data,
      })
  }
}