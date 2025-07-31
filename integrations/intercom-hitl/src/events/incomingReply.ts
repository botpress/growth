import * as bp from ".botpress";
import { adminRepliedEventSchema } from "src/definitions/intercomEvents";
import { htmlToText } from "html-to-text";

// Helper function to strip HTML tags and convert to plain text
const htmlToFormattedText = (html: string): string => {
  return htmlToText(html, {
    wordwrap: false,
    preserveNewlines: true,
  });
};

export const handleIncomingReply = async (
  payload: typeof adminRepliedEventSchema._type,
  logger: bp.Logger,
  client: bp.Client,
): Promise<void> => {
  const conversationId = payload.data.item.id;
  const conversationParts = (
    payload.data.item.conversation_parts as { conversation_parts: any[] }
  ).conversation_parts;
  const latestPart = conversationParts[conversationParts.length - 1];

  if (!latestPart) {
    logger
      .forBot()
      .warn("No conversation part found in admin replied event", {
        conversationId,
      });
    return;
  }

  const adminId = latestPart.author.id;
  const replyText = htmlToFormattedText(latestPart.body);

  logger.forBot().info("Processing conversation.admin.replied event", {
    conversationId,
    adminId,
    replyText,
  });

  const { conversation } = await client.getOrCreateConversation({
    channel: "hitl",
    tags: {
      id: conversationId,
    },
  });

  let adminUser;
  if (adminId) {
    const result = await client.getOrCreateUser({
      tags: {
        intercomAdminId: String(adminId),
      },
    });
    adminUser = result.user;
  }

  if (adminUser && replyText) {
    await client.createMessage({
      conversationId: conversation.id,
      tags: {},
      type: "text",
      payload: {
        text: replyText,
      },
      userId: adminUser.id,
    });
  }

  logger.forBot().info("Admin reply added to conversation", {
    conversationId: conversation.id,
    adminId,
    adminUserId: adminUser?.id,
    replyText,
  });
};
