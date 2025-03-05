import * as bp from '../.botpress'
import { getClient } from './client'

export const channels = {
  hitl: {
    messages: {
      text: async ({ client, ctx, conversation, logger, ...props }: bp.AnyMessageProps) => {
        const zohoClient = getClient(
            ctx.configuration.refreshToken,
            ctx.configuration.clientId,
            ctx.configuration.clientSecret,
            ctx.configuration.dataCenter,
            ctx,
            client
          );

        const { text: userMessage, userId } = props.payload

        const zohoConversationId = conversation.tags.id

        if (!zohoConversationId?.length) {
          logger.forBot().error('No Freshchat Conversation Id')
          return
        }

        return await zohoClient.sendMessage(
          zohoConversationId as string,
          userMessage
        )
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
