import * as bp from '../.botpress'
import { getClient } from './client'

export const channels = {
  hitl: {
    messages: {
      text: async ({ ctx, conversation, logger, payload, user, type }: bp.AnyMessageProps) => {
        logger
          .forBot()
          .info(
            `[HITL Channel - text msg] Received. Botpress User ID: ${user.id}, Botpress Conv ID: ${conversation.id}`
          )

        const brevoClient = getClient(ctx)

        if (type !== 'text') {
          logger
            .forBot()
            .warn('[HITL Channel - text msg] Received a non-text message, skipping Brevo send. Type:', type)
          return
        }

        const { text } = payload
        logger.forBot().info(`[HITL Channel - text msg] Text payload: "${text}"`)
        logger.forBot().info(`[HITL Channel - text msg] User ID: ${user.id}`)

        const brevoConversationId = conversation.tags.id
        if (!brevoConversationId) {
          logger.forBot().error('No conversationId found in conversation tags')
          return
        }
        logger
          .forBot()
          .info(
            `[HITL Channel - text msg] Attempting to send message to Brevo. VisitorID (brevoConversationId): ${brevoConversationId}, Text: "${text}"`
          )

        return await brevoClient.sendMessage(text, brevoConversationId)
      },
      image: async ({ logger, type, user, conversation }: bp.AnyMessageProps) => {
        logger
          .forBot()
          .warn(
            `[HITL Channel] Received '${type}' message for user ${user.id} in conversation ${conversation.id}. Handler not implemented.`
          )
      },
      audio: async ({ logger, type, user, conversation }: bp.AnyMessageProps) => {
        logger
          .forBot()
          .warn(
            `[HITL Channel] Received '${type}' message for user ${user.id} in conversation ${conversation.id}. Handler not implemented.`
          )
      },
      video: async ({ logger, type, user, conversation }: bp.AnyMessageProps) => {
        logger
          .forBot()
          .warn(
            `[HITL Channel] Received '${type}' message for user ${user.id} in conversation ${conversation.id}. Handler not implemented.`
          )
      },
      file: async ({ logger, type, user, conversation }: bp.AnyMessageProps) => {
        logger
          .forBot()
          .warn(
            `[HITL Channel] Received '${type}' message for user ${user.id} in conversation ${conversation.id}. Handler not implemented.`
          )
      },
      bloc: async ({ logger, type, user, conversation }: bp.AnyMessageProps) => {
        logger
          .forBot()
          .warn(
            `[HITL Channel] Received '${type}' message for user ${user.id} in conversation ${conversation.id}. Handler not implemented.`
          )
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
