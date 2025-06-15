import { getClient } from '../client';
import { RuntimeError } from '@botpress/client';
import * as bp from '.botpress';

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, logger, input }) => {
  const liveChatClient = getClient(
    ctx.configuration.clientId,
    ctx.configuration.organizationId,
    logger
  );

  logger.forBot().info("Starting LiveChat HITL...");

  try {
    const { userId, title, description = "No description available" } = input;

    const { user } = await client.getUser({ id: userId })

    const userInfoState = await client.getState({
      id: input.userId,
      name: "userInfo",
      type: "user",
    });

    if (!userInfoState?.state.payload.email) {
      throw new RuntimeError("No userInfo found in state");
    }
    const { email } = userInfoState.state.payload;

    const customerTokenResponse = await liveChatClient.createCustomerToken(`https://webhook.botpress.cloud/${ctx.webhookId}`);
    const accessToken = customerTokenResponse.access_token;

    await liveChatClient.customerUpdate(accessToken, {
      email: email,
    });

    const result = await liveChatClient.startChat(
      title,
      description,
      accessToken
    );

    if (!result.success || !result.data?.chat_id) {
      throw new RuntimeError(result.message || "Failed to create LiveChat conversation");
    }

    const liveChatConversationId = result.data.chat_id;

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: liveChatConversationId,
        userId: user.id,
      },
    });

    await client.updateUser({
      ...user,
      tags: {
        email: email,
        livechatConversationId: liveChatConversationId,
        customerAccessToken: accessToken,
      },
    })

    logger.forBot().debug(`LiveChat Conversation ID: ${liveChatConversationId}`);
    logger.forBot().debug(`Botpress Conversation ID: ${conversation.id}`);

    await client.createEvent({
      type: 'hitlStarted',
      conversationId: conversation.id,
      payload: {
        conversationId: conversation.id,
        userId,
        title: title ?? 'Untitled ticket',
        description,
      },
    })

    return {
      conversationId: conversation.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.forBot().error(`'Create Conversation' exception: ${errorMessage}`);
    throw new RuntimeError(errorMessage);
  }
}

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, client, logger, input }) => {
  const liveChatClient = getClient(
    ctx.configuration.clientId,
    ctx.configuration.organizationId,
    logger
  );

  logger.forBot().info("Stopping LiveChat HITL...");
 
  try {
    const { conversationId } = input as { conversationId: string };

    const { conversation } = await client.getConversation({
      id: conversationId,
    });

    const liveChatConversationId = conversation.tags.id as string;
    const userId = conversation.tags.userId as string;

    if (!liveChatConversationId || !userId) {
      logger.forBot().error("No LiveChat conversation ID or user ID found in conversation tags");
      return {
        success: false,
        message: "No LiveChat conversation ID or user ID found in conversation tags",
      };
    }

    const { user } = await client.getUser({
      id: userId,
    });

    const customerAccessToken = user.tags.customerAccessToken as string;

    if (!customerAccessToken) {
      logger.forBot().error("No customer access token found in user tags");
      return {
        success: false,
        message: "No customer access token found in user tags",
      };
    }

    await liveChatClient.deactivateChat(liveChatConversationId, customerAccessToken);

    await client.createEvent({
      type: 'hitlStopped',
      payload: {
        conversationId,
      },
    });

    return {
      success: true,
      message: "Chat deactivated successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.forBot().error(`'Stop HITL' exception: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
    };
  }
};

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, input, logger }) => {
  try {
    const { name = "None", email = "None", pictureUrl = "None" } = input;

    if (!email) {
      logger.forBot().error('Email necessary for HITL');
      throw new RuntimeError('Email necessary for HITL');
    }

    const { user: botpressUser } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: {
        email: email,
      },
    });

    await client.setState({
      id: botpressUser.id,
      type: "user",
      name: 'userInfo',
      payload: {
        email: email,
      },
    });

    logger.forBot().debug(`Created/Found user: ${botpressUser.id}`);

    return {
      userId: botpressUser.id,
    };
  } catch (error: any) {
    throw new RuntimeError(error.message);
  }
};
