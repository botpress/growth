import { conversation } from '@botpress/sdk';
import * as bp from '../.botpress'
import { getClient } from './client'

export const channels = {
  hitl: {
    messages: {
      text: async ({ client, ctx, conversation, logger, ...props }: bp.AnyMessageProps) => {
        const liveChatClient = getClient(
          ctx.configuration.clientId,
          ctx.configuration.organizationId,
          logger
        );

        const { text: userMessage } = props.payload

        const liveChatConversationId = conversation.tags.id

        if (!liveChatConversationId?.length) {
          logger.forBot().error('No LiveChat Conversation Id')
          return
        }
       
        const { user: botpressUser } = await client.getOrCreateUser({
          tags: {
            livechatConversationId: liveChatConversationId,
          },
        })

        const customerAccessToken = botpressUser.tags.customerAccessToken as string

        return await liveChatClient.sendMessage(
          liveChatConversationId,
          userMessage,
          customerAccessToken
        );
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
