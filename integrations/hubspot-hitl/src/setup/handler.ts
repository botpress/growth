import * as bp from '.botpress'
import { handleConversationCompleted } from 'src/events/operatorConversationCompleted'
import { handleOperatorReplied } from 'src/events/operatorSendMessage'
import { handleOperatorAssignedUpdate } from 'src/events/operatorAssignedUpdate'
import { getClient } from 'src/client'

export const handler: bp.IntegrationProps['handler'] = async ({ ctx, req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }
  
  const hubSpotClient = getClient(ctx, client, ctx.configuration.refreshToken, ctx.configuration.clientId, ctx.configuration.clientSecret, logger);  
  let payload: any
  
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch (err) {
    logger.forBot().error('Failed to parse request body:', err)
    return
  }

  if (Array.isArray(payload)) {
    for (const event of payload) {
      if (
        event.subscriptionType === "conversation.propertyChange" &&
        event.propertyName === "assignedTo" &&
        event.propertyValue
      ) {
        logger.forBot().info(`Operator assigned: ${event.propertyValue}`)
        await handleOperatorAssignedUpdate({ hubspotEvent: event, client, hubSpotClient })
      }

      if (
        event.subscriptionType === "conversation.propertyChange" &&
        event.propertyName === "status" &&
        event.propertyValue === "CLOSED"
      ) {
        logger.forBot().info(`Conversation closed`)
        await handleConversationCompleted({ hubspotEvent: event, client })
      }
    }
    return
  }

  if (payload.type === "OUTGOING_CHANNEL_MESSAGE_CREATED") {
    const message = payload.message?.text
    const integrationThreadId = payload.message?.conversationsThreadId

    logger.forBot().info("New outgoing message from operator")
    logger.forBot().info(`Text: ${message}`)
    logger.forBot().info(`Integration Thread ID: ${integrationThreadId}`)

    await handleOperatorReplied({ hubspotEvent: payload, client })
    return
  }

  logger.forBot().warn("Unhandled HubSpot event format")
}
