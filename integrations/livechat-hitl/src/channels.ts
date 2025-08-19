import * as bp from "../.botpress";
import { getClient } from "./client";
import { RuntimeError } from "@botpress/sdk";
import type { LivechatToken } from "../.botpress/implementation/typings/states/livechatToken";

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
        if (!accessTokenState?.state.payload) {
          throw new RuntimeError("No state payload found");
        }

        const livechatTokenPayload = accessTokenState.state
          .payload as unknown as LivechatToken;

        if (!livechatTokenPayload.customerAccessToken) {
          throw new RuntimeError("No access token found in state");
        }

        const { customerAccessToken } = livechatTokenPayload;

        return await liveChatClient.sendMessage(
          liveChatConversationId,
          userMessage,
          customerAccessToken,
        );
      },
    },
  },
} satisfies bp.IntegrationProps["channels"];
