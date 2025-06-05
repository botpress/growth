import { conversation } from '@botpress/sdk';
import * as bp from '../.botpress'
import { getClient } from './client'

export const channels = {
  hitl: {
    messages: {
      text: async ({ client, ctx, conversation, logger, ...props }: bp.AnyMessageProps) => {
        const hubSpotClient = getClient(ctx, client, ctx.configuration.refreshToken, ctx.configuration.clientId, ctx.configuration.clientSecret, logger);
   
        const { text: userMessage } = props.payload

        const integrationThreadId = conversation.tags.id

        if (!integrationThreadId?.length) {
          logger.forBot().error('No HubSpot Conversation Id')
          return
        }
        const { user: systemUser } = await client.getOrCreateUser({
          name: 'System',
          tags: {
            conversationId: conversation.id,
          },
        })
        // const { user: botpressUser } = await client.getOrCreateUser({
        //   tags: {
        //     conversationId: integrationThreadId,
        //   },
        // })

        const userInfoState = await client.getState({
          id: systemUser.id,
          name: "userInfo",
          type: "user",
        });
    
        if (!userInfoState?.state.payload.phoneNumber) {
          logger.forBot().error("No userInfo found in state");
          return {
            success: false,
            message: "errorMessage",
            data: null,
            conversationId: "error_conversation_id",
          };; 
        }

        const { name, phoneNumber } = userInfoState.state.payload;
        
        return await hubSpotClient.sendMessage(
          userMessage, name, phoneNumber, integrationThreadId
        )
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
