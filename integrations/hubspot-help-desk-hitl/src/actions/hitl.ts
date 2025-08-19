import { getClient } from '../client';
import { RuntimeError } from '@botpress/client';
import * as bp from '.botpress';
import { randomUUID } from 'crypto'


export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, logger, input }) => {
  const hubspotClient = getClient(ctx, client, ctx.configuration.refreshToken, ctx.configuration.clientId, ctx.configuration.clientSecret, logger);

  logger.forBot().info("Starting HITL...");

  try {
    const { userId, title, description = "No description available" } = input;

    const { user } = await client.getUser({ id: userId })

    const { state } = await client.getState({
      id: ctx.integrationId,
      name: "channelInfo",
      type: "integration",
    });

    if (!state?.payload?.channelId) {
      logger.forBot().error("No channelId found in state");

      return {
        success: false,
        message: "Channel ID not found in state. Cannot start HITL.",
        data: null,
        conversationId: "error_no_channel_id",
      };
    }

    const userInfoState = await client.getState({
      id: input.userId,
      name: "userInfo",
      type: "user",
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

    // Prefer phone number if available; otherwise, use email for creating the conversation.
    const contactIdentifier = userPhoneNumber || userEmail!; // userEmail is guaranteed to be present if userPhoneNumber is not
    if (userPhoneNumber) {
      logger.forBot().info(`Using phone number for HITL: ${userPhoneNumber}`);
    } else {
      logger.forBot().info(`Using email for HITL: ${userEmail}`);
    }

    const { name } = userInfoState.state.payload;
    const { channelId, channelAccountId } = state.payload;

    const integrationThreadId = randomUUID();
    logger.forBot().debug(`Integration Thread ID: ${integrationThreadId}`);

    const result = await hubspotClient.createConversation(channelId, channelAccountId, integrationThreadId, name, contactIdentifier, title, description);
    const hubspotConversationId = result.data.conversationsThreadId
    logger.forBot().debug("HubSpot Channel Response:", result);

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: hubspotConversationId,
      },
    });

    await client.updateUser({
      ...user,
      tags: {
        integrationThreadId: integrationThreadId,
        hubspotConversationId: hubspotConversationId,
      },
    })

    logger.forBot().debug(`HubSpot Channel ID: ${channelId}`);
    logger.forBot().debug(`Botpress Conversation ID: ${conversation.id}`);

    return {
      conversationId: conversation.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.forBot().error(`'Create Conversation' exception: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
      conversationId: "error_conversation_id",
    };
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ }) => {
  
  return {};
};

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, input, ctx, logger }) => {
  try {
    // The 'email' input field can accept either an email address or a phone number.
    const { name = "None", email = "None", pictureUrl = "None" } = input;

    if (email === "None" || !email || !email.trim()) {
      const errorMessage = 'An identifier (email or phone number) is required for HITL user creation.';
      logger.forBot().error(errorMessage);
      throw new RuntimeError(errorMessage);
    }

    const trimmedEmail = email.trim();
    let userInfoPayload: { name: string; phoneNumber?: string; email?: string; [key: string]: any } = {
      name: name,
    };
    let userTags: { email?: string; phoneNumber?: string; [key: string]: any } = {};

    if (trimmedEmail.includes('@')) {
      logger.forBot().info(`Input '${trimmedEmail}' identified as an email address.`);
      userInfoPayload.email = trimmedEmail;
      userTags.email = trimmedEmail;
      userTags.contactType = 'email';
    } else {
      logger.forBot().info(`Input '${trimmedEmail}' identified as a phone number.`);
      userInfoPayload.phoneNumber = trimmedEmail;
      userTags.phoneNumber = trimmedEmail;
      userTags.contactType = 'phone';
    }

    const { user: botpressUser } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: userTags,
    });

    await client.setState({
      id: botpressUser.id,
      type: "user",
      name: 'userInfo',
      payload: userInfoPayload,
    });

    logger.forBot().debug(`Created/Found user: ${botpressUser.id}`);

    return {
      userId: botpressUser.id,
    };
  } catch (error: any) {
    throw new RuntimeError(error.message);
  }
};