import * as bp from '../.botpress'
import { getClient } from './client'

export const channels = {
  hitl: {
    messages: {
      text: async ({ client, ctx, conversation, logger, payload }) => {
        const zohoClient = getClient(
          ctx.configuration.refreshToken,
          ctx.configuration.clientId,
          ctx.configuration.clientSecret,
          ctx.configuration.dataCenter,
          ctx,
          client
        )

        const userMessage = payload.text
        const zohoConversationId = conversation.tags.id

        if (zohoConversationId === undefined || zohoConversationId === '') {
          logger.forBot().error('No Zoho Conversation Id')
          return
        }

        await zohoClient.sendMessage(zohoConversationId, userMessage)
      },
      bloc: async ({ logger }) => {
        logger.forBot().warn('Unsupported message type: bloc')
      },
      file: async ({ logger }) => {
        logger.forBot().warn('Unsupported message type: file')
      },
      video: async ({ logger }) => {
        logger.forBot().warn('Unsupported message type: video')
      },
      audio: async ({ logger }) => {
        logger.forBot().warn('Unsupported message type: audio')
      },
      image: async ({ logger }) => {
        logger.forBot().warn('Unsupported message type: image')
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
