import * as bp from '.botpress'
import { handleConversationCompleted } from 'src/events/operatorConversationCompleted'
import { handleOperatorAssignedUpdate } from 'src/events/operatorAssignedUpdate'
import { handleConversationMissed } from 'src/events/operatorConversationMissed'
import { handleOperatorReplied } from 'src/events/operatorSendMessage'

export const handler: bp.IntegrationProps['handler'] = async ({ ctx, req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  logger.forBot().debug('Handler received request from Zoho SalesIQ with payload:', req.body)

  const salesIqEvent = JSON.parse(req.body)

  switch (salesIqEvent.event) {
    case 'conversation.missed':
      await handleConversationMissed({ salesIqEvent, client })
      break
    case 'conversation.attender.updated':
      await handleOperatorAssignedUpdate({ salesIqEvent, client })
      break 
    case 'conversation.operator.replied':
      await handleOperatorReplied({ salesIqEvent, client })
      break
    case 'conversation.completed':
      await handleConversationCompleted({ salesIqEvent, client })
      break
    default:
      logger.forBot().warn('Unhandled Zoho SalesIQ event type: ' + salesIqEvent.event)
  }
}
