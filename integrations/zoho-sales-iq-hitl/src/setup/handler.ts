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

  const operatorReplied = OperatorRepliedEventSchema.safeParse(rawPayload)
  if (operatorReplied.success) {
    await handleOperatorReplied({ salesIqEvent: operatorReplied.data, client })
    return
  } else if (payloadEvent === 'conversation.operator.replied') {
    validationErrors.push({
      eventType: 'conversation.operator.replied',
      issues: operatorReplied.error.issues,
    })
  }

  const attenderUpdated = AttenderUpdatedEventSchema.safeParse(rawPayload)
  if (attenderUpdated.success) {
    await handleOperatorAssignedUpdate({ salesIqEvent: attenderUpdated.data, client })
    return
  } else if (payloadEvent === 'conversation.attender.updated') {
    validationErrors.push({
      eventType: 'conversation.attender.updated',
      issues: attenderUpdated.error.issues,
    })
  }

  const conversationCompleted = ConversationCompletedEventSchema.safeParse(rawPayload)
  if (conversationCompleted.success) {
    await handleConversationCompleted({ salesIqEvent: conversationCompleted.data, client })
    return
  } else if (payloadEvent === 'conversation.completed') {
    validationErrors.push({
      eventType: 'conversation.completed',
      issues: conversationCompleted.error.issues,
    })
  }

  const conversationMissed = ConversationMissedEventSchema.safeParse(rawPayload)
  if (conversationMissed.success) {
    await handleConversationMissed({ salesIqEvent: conversationMissed.data, client })
    return
  } else if (payloadEvent === 'conversation.missed') {
    validationErrors.push({
      eventType: 'conversation.missed',
      issues: conversationMissed.error.issues,
    })
  }

  // Only log if all validations failed
  if (validationErrors.length > 0) {
    logger.forBot().warn('Event payload matched a known event type but failed validation', {
      validationErrors,
      rawPayload,
    })
  } else {
    logger.forBot().warn('Unrecognized event payload', { rawPayload })
  }
}
