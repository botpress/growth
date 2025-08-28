import { getClient } from "../client";
import { RuntimeError } from "@botpress/client";
import * as bp from ".botpress";
import type { Payload as LivechatTokenPayload } from ".botpress/implementation/typings/states/livechatToken/payload";

export const startHitl: bp.IntegrationProps["actions"]["startHitl"] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const liveChatClient = getClient(
    ctx.configuration.clientId,
    ctx.configuration.organizationId,
    logger,
  );

  logger.forBot().info("Starting LiveChat HITL...");

  try {
    const { userId, title, description = "No description available" } = input;

    const { user } = await client.getUser({ id: userId });

    const userInfoState = await client.getState({
      id: input.userId,
      name: "userInfo",
      type: "user",
    });

    if (!userInfoState?.state?.payload) {
      throw new RuntimeError("No userInfo found in state");
    }

    const payload = userInfoState.state.payload as unknown as { email: string };

    if (!payload.email) {
      throw new RuntimeError("No email found in userInfo state");
    }

    const { email } = payload;

    if (!ctx.configuration.agentToken || !ctx.configuration.groupId) {
      throw new RuntimeError(
        "Agent token and group ID are required for HITL conversations",
      );
    }

    const initialMessage = `${title}\n\n${description}`;
    const agentResult = await liveChatClient.startAgentChat(
      ctx.configuration.agentToken,
      ctx.configuration.groupId,
      initialMessage,
    );

    if (!agentResult.success || !agentResult.chatId) {
      throw new RuntimeError(
        agentResult.message ||
          "Failed to create LiveChat conversation via Agent API",
      );
    }

    const liveChatConversationId = agentResult.chatId;
    logger
      .forBot()
      .info(`Agent chat started with ID: ${liveChatConversationId}`);

    const customerTokenResponse = await liveChatClient.createCustomerToken(
      `https://webhook.botpress.cloud/${ctx.webhookId}`,
    );
    const accessToken = customerTokenResponse.access_token;

    await liveChatClient.customerUpdate(accessToken, {
      email: email,
    });

    const addCustomerResult = await liveChatClient.addCustomerToChat(
      ctx.configuration.agentToken,
      liveChatConversationId,
      accessToken,
      { email, name: user.name },
    );

    if (!addCustomerResult.success) {
      const errorMessage = `Failed to add customer to chat: ${addCustomerResult.message}`;
      logger.forBot().error(errorMessage);
      throw new RuntimeError(errorMessage);
    }

    logger
      .forBot()
      .info(
        `Transferring chat to group ${ctx.configuration.groupId} to ensure proper placement...`,
      );
    const transferResult = await liveChatClient.transferChat(
      ctx.configuration.agentToken,
      liveChatConversationId,
      ctx.configuration.groupId,
    );

    if (transferResult.success) {
      logger
        .forBot()
        .info(
          `Chat transferred successfully to group ${ctx.configuration.groupId}`,
        );
    } else {
      logger
        .forBot()
        .warn(`Failed to transfer chat: ${transferResult.message}`);
    }

    const { conversation } = await client.getOrCreateConversation({
      channel: "hitl",
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
      },
    });

    await client.setState({
      id: conversation.id,
      type: "conversation",
      name: "livechatToken",
      payload: {
        livechatConversationId: liveChatConversationId,
        customerAccessToken: accessToken,
      } as any,
    });

    logger
      .forBot()
      .debug(`LiveChat Conversation ID: ${liveChatConversationId}`);
    logger.forBot().debug(`Botpress Conversation ID: ${conversation.id}`);

    await client.createEvent({
      type: "hitlStarted",
      conversationId: conversation.id,
      payload: {
        conversationId: conversation.id,
        userId,
        title: title ?? "Untitled ticket",
        description,
      },
    });

    return {
      conversationId: conversation.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (typeof error === 'object' && error !== null 
        ? JSON.stringify(error) 
        : String(error));
    logger.forBot().error(`'Create Conversation' exception: ${errorMessage}`);
    throw new RuntimeError(errorMessage);
  }
};

export const stopHitl: bp.IntegrationProps["actions"]["stopHitl"] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const liveChatClient = getClient(
    ctx.configuration.clientId,
    ctx.configuration.organizationId,
    logger,
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
      logger
        .forBot()
        .error(
          "No LiveChat conversation ID or user ID found in conversation tags",
        );
      return {
        success: false,
        message:
          "No LiveChat conversation ID or user ID found in conversation tags",
      };
    }

    const accessTokenState = await client.getState({
      id: conversationId,
      name: "livechatToken",
      type: "conversation",
    });

    if (!(accessTokenState?.state.payload as any)?.livechatConversationId) {
      throw new RuntimeError("No LiveChat conversation ID found in state");
    }
    const { livechatConversationId: stateConversationId } = accessTokenState
      .state.payload as unknown as LivechatTokenPayload;

    if (!stateConversationId) {
      logger.forBot().error("No LiveChat conversation ID found in state");
      return {
        success: false,
        message: "No LiveChat conversation ID found in state",
      };
    }
    if (!ctx.configuration.agentToken) {
      throw new RuntimeError(
        "Agent token is required to stop HITL conversation",
      );
    }

    await liveChatClient.deactivateChatWithAgent(
      ctx.configuration.agentToken,
      liveChatConversationId,
    );

    await client.createEvent({
      type: "hitlStopped",
      payload: {
        conversationId,
      },
    });

    return {
      success: true,
      message: "Chat deactivated successfully",
    };
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (typeof error === 'object' && error !== null 
        ? JSON.stringify(error) 
        : String(error));
    logger.forBot().error(`'Stop HITL' exception: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
    };
  }
};

export const createUser: bp.IntegrationProps["actions"]["createUser"] = async ({
  client,
  input,
  logger,
}) => {
  try {
    const { name = "None", email = "None", pictureUrl = "None" } = input;

    if (!email) {
      logger.forBot().error("Email necessary for HITL");
      throw new RuntimeError("Email necessary for HITL");
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
      name: "userInfo",
      payload: {
        email: email,
      } as any,
    });

    logger.forBot().debug(`Created/Found user: ${botpressUser.id}`);

    return {
      userId: botpressUser.id,
    };
  } catch (error: any) {
    throw new RuntimeError(error.message);
  }
};
