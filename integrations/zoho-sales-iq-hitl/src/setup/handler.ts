import * as bp from '.botpress'
import { handleConversationCompleted } from 'src/events/operatorConversationCompleted'
import { handleOperatorAssignedUpdate } from 'src/events/operatorAssignedUpdate'
import { handleConversationMissed } from 'src/events/operatorConversationMissed'
import { handleOperatorReplied } from 'src/events/operatorSendMessage'
import {
  OperatorRepliedEventSchema,
  AttenderUpdatedEventSchema,
  ConversationCompletedEventSchema,
  ConversationMissedEventSchema,
} from 'src/definitions/webhook-events'

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[]

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

  const operatorReplied = OperatorRepliedEventSchema.safeParse(rawPayload)
  if (operatorReplied.success) {
    await handleOperatorReplied({ salesIqEvent: operatorReplied.data, client })
    return
  }

  const attenderUpdated = AttenderUpdatedEventSchema.safeParse(rawPayload)
  if (attenderUpdated.success) {
    await handleOperatorAssignedUpdate({ salesIqEvent: attenderUpdated.data, client })
    return
  }

  const conversationCompleted = ConversationCompletedEventSchema.safeParse(rawPayload)
  if (conversationCompleted.success) {
    await handleConversationCompleted({ salesIqEvent: conversationCompleted.data, client })
    return
  }

  const conversationMissed = ConversationMissedEventSchema.safeParse(rawPayload)
  if (conversationMissed.success) {
    await handleConversationMissed({ salesIqEvent: conversationMissed.data, client })
    return
  }

  logger.forBot().warn('Unrecognized event payload', { rawPayload })
}
