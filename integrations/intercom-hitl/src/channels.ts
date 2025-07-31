import * as bp from "../.botpress";
import { getClient } from "./client";
import { RuntimeError } from "@botpress/sdk";

export const channels = {
  hitl: {
    messages: {
      text: async ({
        client,
        ctx,
        conversation,
        logger,
        ...props
      }: bp.AnyMessageProps) => {
        const intercomClient = getClient(ctx.configuration.accessToken, logger);

        const { text: userMessage } = props.payload;

        const intercomConversationId = conversation.tags.id;

        if (!intercomConversationId?.length) {
          logger.forBot().error("No Intercom Conversation Id");
          throw new RuntimeError("No Intercom Conversation Id");
        }

        const intercomContact = await client.getState({
          id: conversation.id,
          name: "intercomContact",
          type: "conversation",
        });

        if (!intercomContact.state.payload.intercomContactId) {
          logger
            .forBot()
            .error("No Intercom Contact ID found in conversation state");
          throw new RuntimeError(
            "No Intercom Contact ID found in conversation state",
          );
        }

        const intercomContactId =
          intercomContact.state.payload.intercomContactId;
        logger
          .forBot()
          .info(
            `Sending message to Intercom - Conversation ID: ${intercomConversationId}, Contact ID: ${intercomContactId}, Message: ${userMessage}`,
          );

        return await intercomClient.replyToConversation(
          intercomConversationId,
          intercomContactId,
          userMessage,
        );
      },
    },
  },
} satisfies bp.IntegrationProps["channels"];
