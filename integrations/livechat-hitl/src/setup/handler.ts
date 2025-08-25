import * as sdk from "@botpress/sdk";
import * as bp from ".botpress";
import { handleIncomingMessage } from "src/events/incomingMessage";
import { handleChatDeactivated } from "src/events/chatDeactivated";
import { handleChatTransferred } from "src/events/chatTransferred";
import {
  liveChatWebhookPayloadSchema,
  LiveChatTransferred,
} from "src/definitions/livechatEvents";

const retrieveHitlConversation = async ({
  liveChatId,
  client,
  ctx,
  logger,
}: {
  liveChatId: string;
  client: bp.Client;
  ctx: bp.Context;
  logger: bp.Logger;
}) => {
  if (!ctx.configuration.ignoreNonHitlConversations) {
    const { conversation } = await client.getOrCreateConversation({
      channel: "hitl",
      tags: { id: liveChatId },
    });

    return conversation;
  }

  try {
    // Try to find an existing conversation with the LiveChat ID
    const { conversations } = await client.listConversations({
      tags: { id: liveChatId },
    });

    if (conversations.length === 0) {
      logger
        .forBot()
        .debug(
          "No Botpress conversation found for LiveChat ID. Ignoring the conversation...",
          {
            liveChatId,
          },
        );
      return;
    }

    const conversation = conversations[0]!;

    if (conversation.channel !== "hitl") {
      logger
        .forBot()
        .debug(
          "Ignoring the conversation since it was not created by the startHitl action",
          {
            conversation,
            liveChatId,
          },
        );
      return;
    }

    return conversation;
  } catch (thrown: unknown) {
    if (sdk.isApiError(thrown) && (thrown as any).code === 404) {
      logger
        .forBot()
        .debug(
          "Ignoring the conversation since it does not refer to a Botpress conversation",
          {
            liveChatId,
          },
        );
      return;
    }
    const formattedThrown = JSON.stringify(thrown, null, 2);
    throw new sdk.RuntimeError(`${formattedThrown}`);
  }
};

export const handler: bp.IntegrationProps["handler"] = async ({
  ctx,
  req,
  logger,
  client,
}) => {
  if (!req.body) {
    logger.forBot().warn("Handler received an empty body");
    return;
  }

  let rawPayload: unknown;
  try {
    rawPayload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    logger
      .forBot()
      .debug("Raw webhook payload:", JSON.stringify(rawPayload, null, 2));
  } catch (err) {
    logger.forBot().error("Failed to parse request body:", err);
    return;
  }

  const validationResult = liveChatWebhookPayloadSchema.safeParse(rawPayload);
  if (!validationResult.success) {
    logger.forBot().error("Invalid webhook payload:", {
      error: validationResult.error,
      receivedPayload: rawPayload,
    });
    return;
  }

  const webhookPayload = validationResult.data;
  const secret_key = webhookPayload.secret_key;

  if (secret_key !== ctx.configuration.webhookSecret) {
    logger.forBot().error("Invalid webhook secret", {
      received_secret: secret_key,
      expected_secret: ctx.configuration.webhookSecret,
    });
    return;
  }
  logger.forBot().info("Webhook secret verified");

  const {
    action,
    payload: eventPayload,
    webhook_id,
    organization_id,
    additional_data,
  } = webhookPayload;

  logger.forBot().info(`Received LiveChat webhook event: ${action}`, {
    webhook_id,
    organization_id,
    action,
    chat_id: eventPayload.chat_id,
    thread_id: eventPayload.thread_id,
    additional_data: {
      has_chat_properties: !!additional_data?.chat_properties,
      presence_users: additional_data?.chat_presence_user_ids?.length || 0,
    },
  });

  // Check if we should process this conversation
  const conversation = await retrieveHitlConversation({
    liveChatId: eventPayload.chat_id,
    client,
    ctx,
    logger,
  });

  if (!conversation) {
    logger.forBot().debug("Ignoring event for non-HITL conversation", {
      action,
      chat_id: eventPayload.chat_id,
    });
    return;
  }

  switch (action) {
    case "incoming_event": {
      if (!("event" in eventPayload)) {
        logger.forBot().warn("Received incoming_event without event data", {
          webhook_id,
          organization_id,
          payload: eventPayload,
        });
        return;
      }

      switch (eventPayload.event.type) {
        case "message":
          logger.forBot().info("Processing incoming message event", {
            chat_id: eventPayload.chat_id,
            thread_id: eventPayload.thread_id,
            event: eventPayload.event,
            additional_data,
          });
          await handleIncomingMessage(
            webhookPayload,
            logger,
            client,
            conversation,
          );
          break;

        default:
          logger
            .forBot()
            .info("Received incoming_event with unhandled event type", {
              event_type: eventPayload.event.type,
              chat_id: eventPayload.chat_id,
              thread_id: eventPayload.thread_id,
              additional_data,
            });
      }
      break;
    }

    case "chat_deactivated": {
      logger.forBot().info("Processing chat deactivated event", {
        chat_id: eventPayload.chat_id,
        thread_id: eventPayload.thread_id,
        additional_data,
      });
      await handleChatDeactivated(webhookPayload, logger, client, conversation);
      break;
    }

    case "chat_transferred": {
      const transferredPayload = eventPayload as LiveChatTransferred;

      logger.forBot().info("Processing chat transferred event", {
        chat_id: transferredPayload.chat_id,
        thread_id: transferredPayload.thread_id,
        transferred_to: transferredPayload.transferred_to,
        additional_data,
      });

      await handleChatTransferred(webhookPayload, logger, client, conversation);
      break;
    }

    default:
      logger.forBot().warn(`Unhandled LiveChat event type: ${action}`, {
        action,
        webhook_id,
        organization_id,
        payload: eventPayload,
        additional_data,
      });
  }
};
