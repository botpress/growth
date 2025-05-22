import * as bp from '../.botpress'
import { getClient } from './client'

export const channels = {
  hitl: {
    messages: {
      text: async ({ client, ctx, conversation, logger, ...props }: bp.AnyMessageProps) => {
        const hubSpotClient = getClient(ctx, client, ctx.configuration.refreshToken, ctx.configuration.clientId, ctx.configuration.clientSecret);
   
        const { text: userMessage, userId } = props.payload

        const hubspotConversationId = conversation.tags.id

        if (!hubspotConversationId?.length) {
          logger.forBot().error('No HubSpot Conversation Id')
          return
        }

        const userInfoState = await client.getState({
          id: ctx.integrationId,
          name: "userInfo",
          type: "integration",
        });
    
        // Check if either phoneNumber or email is present in the userInfo state
        const userPhoneNumber = userInfoState?.state.payload.phoneNumber;
        const userEmail = userInfoState?.state.payload.email;

        if (!userPhoneNumber && !userEmail) {
          logger.forBot().error("No user identifier (phone number or email) found in state for HITL.");
          return {
            success: false,
            message: "User identifier (phone number or email) not found. Please ensure the user is created with an identifier.",
            data: null,
            conversationId: "error_no_user_identifier",
          };
        }

        const { name } = userInfoState.state.payload;
        
        // Prefer phone number if available, otherwise use email
        const contactIdentifier = userPhoneNumber || userEmail!;
        if (userPhoneNumber) {
          logger.forBot().info(`Using phone number for message: ${userPhoneNumber}`);
        } else {
          logger.forBot().info(`Using email for message: ${userEmail}`);
        }
        
        return await hubSpotClient.sendMessage(
          userMessage, name, contactIdentifier
        )
      },
    },
  },
} satisfies bp.IntegrationProps['channels']
