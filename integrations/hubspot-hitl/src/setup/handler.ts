import * as bp from ".botpress";
import { handleConversationCompleted } from "src/events/operatorConversationCompleted";
import { handleOperatorReplied } from "src/events/operatorSendMessage";
import { handleOperatorAssignedUpdate } from "src/events/operatorAssignedUpdate";
import { getClient } from "src/client";
import { validateHubSpotSignature } from "src/utils/signature";

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

  // Get required headers for signature validation
  const signature = req.headers["x-hubspot-signature-v3"];
  const timestamp = req.headers["x-hubspot-request-timestamp"];
  const rawBody =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  // Get the webhook URL from the configuration
  const webhookUrl = `https://webhook.botpress.cloud/${ctx.webhookId}`;

  if (
    !validateHubSpotSignature(
      rawBody,
      signature as string,
      timestamp as string,
      req.method,
      webhookUrl,
      ctx.configuration.clientSecret,
      logger,
    )
  ) {
    return;
  }

  logger.forBot().info("HubSpot webhook signature verified successfully");

  const hubSpotClient = getClient(
    ctx,
    client,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    logger,
  );
  let payload: any;

  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    logger.forBot().error("Failed to parse request body:", err);
    return;
  }

  if (Array.isArray(payload)) {
    for (const event of payload) {
      if (
        event.subscriptionType === "conversation.propertyChange" &&
        event.propertyName === "assignedTo" &&
        event.propertyValue
      ) {
        logger.forBot().info(`Operator assigned: ${event.propertyValue}`);
        await handleOperatorAssignedUpdate({
          hubspotEvent: event,
          client,
          hubSpotClient,
        });
      }

      if (
        event.subscriptionType === "conversation.propertyChange" &&
        event.propertyName === "status" &&
        event.propertyValue === "CLOSED"
      ) {
        logger.forBot().info(`Conversation closed`);
        await handleConversationCompleted({ hubspotEvent: event, client });
      }
    }
    return;
  }

  if (payload.type === "OUTGOING_CHANNEL_MESSAGE_CREATED") {
    const message = payload.message?.text;
    const integrationThreadId = payload.message?.conversationsThreadId;

    logger.forBot().info("New outgoing message from operator");
    logger.forBot().info(`Text: ${message}`);
    logger.forBot().info(`Integration Thread ID: ${integrationThreadId}`);

    await handleOperatorReplied({ hubspotEvent: payload, client });
    return;
  }

  logger.forBot().warn("Unhandled HubSpot event format");
};
