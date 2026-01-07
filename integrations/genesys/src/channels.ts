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

        const genesysClient = getClient(ctx)

        if (type !== 'text') {
          logger
            .forBot()
            .warn('[HITL Channel - text msg] Received a non-text message, skipping Genesys send. Type:', type)
          return
        }

        const { text } = payload
        logger.forBot().info(`[HITL Channel - text msg] Text payload: "${text}"`)

        const externalUserId = conversation.tags.id
        if (!externalUserId) {
          logger.forBot().error('No externalUserId found in conversation tags')
          return
        }

        // For nickname, we can just use the user id for now
        // In a real implementation, you might want to store this in conversation tags
        const nickname = user.name || externalUserId

        logger
          .forBot()
          .info(
            `[HITL Channel - text msg] Attempting to send message to Genesys. ExternalUserId: ${externalUserId}, Text: "${text}"`
          )

        return await genesysClient.sendMessage(externalUserId, nickname, text)
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
