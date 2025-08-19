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
        const liveChatClient = getClient(
          ctx.configuration.clientId,
          ctx.configuration.organizationId,
          logger,
        );

        const { text: userMessage } = props.payload;

        const liveChatConversationId = conversation.tags.id;

        if (!liveChatConversationId?.length) {
          logger.forBot().error("No LiveChat Conversation Id");
          return;
        }

        const accessTokenState = await client.getState({
          id: conversation.id,
          name: "livechatToken",
          type: "conversation",
        });

        if (!accessTokenState?.state.payload.customerAccessToken) {
          throw new RuntimeError("No access token found in state");
        }
        const { customerAccessToken } = accessTokenState.state.payload;

        return await liveChatClient.sendMessage(
          liveChatConversationId,
          userMessage,
          customerAccessToken,
        );
      },
    },
  },
} satisfies bp.IntegrationProps["channels"];
