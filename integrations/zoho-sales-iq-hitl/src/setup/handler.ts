import * as bp from '.botpress'
import { JsonValue } from 'src/definitions/literals'
import {
  AttenderUpdatedEventSchema,
  ConversationCompletedEventSchema,
  ConversationMissedEventSchema,
  OperatorRepliedEventSchema,
} from 'src/definitions/webhook-events'
import { handleOperatorAssignedUpdate } from 'src/events/operatorAssignedUpdate'
import { handleConversationCompleted } from 'src/events/operatorConversationCompleted'
import { handleConversationMissed } from 'src/events/operatorConversationMissed'
import { handleOperatorReplied } from 'src/events/operatorSendMessage'

export const handler: bp.IntegrationProps['handler'] = async ({ req, logger, client }) => {
  if (!req.body) {
    logger.forBot().warn('Handler received an empty body')
    return
  }

  let rawPayload: JsonValue
  try {
    rawPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    logger.forBot().error('Failed to parse request body')
    return
  }

  const payloadEvent =
    typeof rawPayload === 'object' && rawPayload !== null && 'event' in rawPayload ? String(rawPayload.event) : null

  const validationErrors: Array<{ eventType: string; issues: unknown[] }> = []

  switch (payloadEvent) {
    case 'conversation.operator.replied': {
      const operatorReplied = OperatorRepliedEventSchema.safeParse(rawPayload)
      if (operatorReplied.success) {
        await handleOperatorReplied({ salesIqEvent: operatorReplied.data, client })
      } else {
        validationErrors.push({
          eventType: payloadEvent,
          issues: operatorReplied.error.issues,
        })
      }
      break
    }
    case 'conversation.attender.updated': {
      const attenderUpdated = AttenderUpdatedEventSchema.safeParse(rawPayload)
      if (attenderUpdated.success) {
        await handleOperatorAssignedUpdate({ salesIqEvent: attenderUpdated.data, client })
      } else {
        validationErrors.push({
          eventType: payloadEvent,
          issues: attenderUpdated.error.issues,
        })
      }
      break
    }
    case 'conversation.completed': {
      const conversationCompleted = ConversationCompletedEventSchema.safeParse(rawPayload)
      if (conversationCompleted.success) {
        await handleConversationCompleted({ salesIqEvent: conversationCompleted.data, client })
      } else {
        validationErrors.push({
          eventType: payloadEvent,
          issues: conversationCompleted.error.issues,
        })
      }
      break
    }
    case 'conversation.missed': {
      const conversationMissed = ConversationMissedEventSchema.safeParse(rawPayload)
      if (conversationMissed.success) {
        await handleConversationMissed({ salesIqEvent: conversationMissed.data, client })
      } else {
        validationErrors.push({
          eventType: payloadEvent,
          issues: conversationMissed.error.issues,
        })
      }
      break
    }
    default:
      logger.forBot().error('No handler found for event type', { payloadEvent })
      break
  }

  if (validationErrors.length > 0) {
    logger.forBot().error('Event payload matched a known event type but failed validation', {
      validationErrors,
      rawPayload,
    })
  }
}
