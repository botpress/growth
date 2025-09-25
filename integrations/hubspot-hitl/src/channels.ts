import { conversation } from '@botpress/sdk'
import * as bp from '../.botpress'
import { getClient } from './client'

export const channels = {
  hitl: {
    messages: {
      text: async ({ client, ctx, conversation, logger, ...props }: bp.AnyMessageProps) => {
        const hubSpotClient = getClient(
          ctx,
          client,
          ctx.configuration.refreshToken,
          ctx.configuration.clientId,
          ctx.configuration.clientSecret,
          logger
        )

        const { text: userMessage } = props.payload

        const hubspotConversationId = conversation.tags.id

        if (!hubspotConversationId?.length) {
          logger.forBot().error('No HubSpot Inbox Conversation Id')
          return
        }

        const { user: botpressUser } = await client.getOrCreateUser({
          tags: {
            hubspotConversationId: hubspotConversationId,
          },
        })

        const userInfoState = await client.getState({
          id: botpressUser.id,
          name: 'userInfo',
          type: 'user',
        })

        if (!userInfoState?.state.payload.phoneNumber) {
          logger.forBot().error('No userInfo found in state')
          return {
            success: false,
            message: 'errorMessage',
            data: null,
            conversationId: 'error_conversation_id',
          }
        }

        const { name, phoneNumber } = userInfoState.state.payload
        return await hubSpotClient.sendMessage(
          userMessage,
          name,
          phoneNumber,
          botpressUser.tags.integrationThreadId as string
        )
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
