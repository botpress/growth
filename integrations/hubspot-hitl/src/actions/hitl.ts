import { getClient } from "../client";
import { RuntimeError } from "@botpress/client";
import * as bp from ".botpress";
import { randomUUID } from "crypto";

export const startHitl: bp.IntegrationProps["actions"]["startHitl"] = async ({
  ctx,
  client,
  logger,
  input,
}) => {
  const hubspotClient = getClient(
    ctx,
    client,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    logger,
  );

  logger.forBot().info("Starting HITL...");

  try {
    const {
      userId,
      title = "New HITL conversation",
      description = "No description available",
    } = input;

    const { user } = await client.getUser({ id: userId });

    const { state } = await client.getState({
      id: ctx.integrationId,
      name: "channelInfo",
      type: "integration",
    });

    if (!state?.payload?.channelId) {
      logger.forBot().error("No channelId found in state");

      return {
        success: false,
        message: "errorMessage",
        data: null,
        conversationId: "error_conversation_id",
      };
    }

    const userInfoState = await client.getState({
      id: input.userId,
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
      };
    }
    const { name, phoneNumber } = userInfoState.state.payload;
    const { channelId, channelAccountId } = state.payload;

    const integrationThreadId = randomUUID();
    logger.forBot().debug(`Integration Thread ID: ${integrationThreadId}`);

    const result = await hubspotClient.createConversation(
      channelId,
      channelAccountId,
      integrationThreadId,
      name,
      phoneNumber,
      title,
      description,
    );
    const hubspotConversationId = result.data.conversationsThreadId;
    logger.forBot().debug("HubSpot Inbox Channel Response:", result);

    const { conversation } = await client.getOrCreateConversation({
      channel: "hitl",
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
    });

    logger.forBot().debug(`HubSpot Inbox Channel ID: ${channelId}`);
    logger.forBot().debug(`Botpress Conversation ID: ${conversation.id}`);

    return {
      conversationId: conversation.id,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.forBot().error(`'Create Conversation' exception: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
      conversationId: "error_conversation_id",
    };
  }
};

export const stopHitl: bp.IntegrationProps["actions"]["stopHitl"] =
  async ({}) => {
    return {};
  };

export const createUser: bp.IntegrationProps["actions"]["createUser"] = async ({
  client,
  input,
  logger,
}) => {
  try {
    // Phone number is being stored in email field
    // This is a workaround until we have a better solution to store phone numbers in the input.
    const { name = "None", email = "None", pictureUrl = "None" } = input;

    if (!email) {
      logger.forBot().error("Email necessary for HITL");
      throw new RuntimeError("Email necessary for HITL");
    }

    const { user: botpressUser } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: {
        phoneNumber: email,
      },
    });

    await client.setState({
      id: botpressUser.id,
      type: "user",
      name: "userInfo",
      payload: {
        name,
        phoneNumber: email,
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
