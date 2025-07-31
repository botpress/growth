import * as bp from ".botpress";
import {
  adminAssignedEventSchema,
  adminRepliedEventSchema,
  adminClosedEventSchema,
} from "src/definitions/intercomEvents";
import { handleConversationAssigned } from "src/events/conversationAssigned";
import { handleConversationClosed } from "src/events/conversationClosed";
import { handleIncomingReply } from "src/events/incomingReply";

export const handler: bp.IntegrationProps["handler"] = async ({
  logger,
  req,
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

  const adminAssignedResult = adminAssignedEventSchema.safeParse(rawPayload);
  if (adminAssignedResult.success) {
    logger
      .forBot()
      .info("Received and validated conversation.admin.assigned event");
    await handleConversationAssigned(adminAssignedResult.data, logger, client);
    return;
  }

  const adminRepliedResult = adminRepliedEventSchema.safeParse(rawPayload);
  if (adminRepliedResult.success) {
    logger
      .forBot()
      .info("Received and validated conversation.admin.replied event");
    await handleIncomingReply(adminRepliedResult.data, logger, client);
    return;
  }

  const adminClosedResult = adminClosedEventSchema.safeParse(rawPayload);
  if (adminClosedResult.success) {
    logger
      .forBot()
      .info("Received and validated conversation.admin.closed event");
    await handleConversationClosed(adminClosedResult.data, logger, client);
    return;
  }

  logger.forBot().warn("Received unrecognized event payload", { rawPayload });
};
