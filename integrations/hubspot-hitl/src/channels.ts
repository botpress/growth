import * as bp from "../.botpress";
import { getClient } from "./client";
import { RuntimeError } from "@botpress/sdk";

const getHubspotContextFromMessage = async (props: bp.AnyMessageProps) => {
  const { client, ctx, conversation, logger } = props;
  const hubSpotClient = getClient(
    ctx,
    client,
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    logger,
  );

  const hubspotConversationId = conversation.tags.id;
  if (!hubspotConversationId?.length) {
    logger.forBot().error("No HubSpot Conversation Id");
    throw new RuntimeError("No HubSpot Conversation Id");
  }

  const { user: botpressUser } = await client.getOrCreateUser({
    tags: { hubspotConversationId },
  });

  const userInfoState = await client.getState({
    id: botpressUser.id,
    name: "userInfo",
    type: "user",
  });

  const name = userInfoState?.state.payload.name;
  const phoneNumber = userInfoState?.state.payload.phoneNumber;
  const contactIdentifier = phoneNumber;
  if (!contactIdentifier) {
    logger
      .forBot()
      .error(
        "No user identifier (phone number or email) found in state for HITL.",
      );
    throw new RuntimeError("No user identifier found");
  }

  const integrationThreadId = botpressUser.tags.integrationThreadId as string;
  return { hubSpotClient, name, contactIdentifier, integrationThreadId };
};

export const channels = {
  hitl: {
    messages: {
      bloc: async (props: bp.AnyMessageProps) => {
        const { hubSpotClient, name, contactIdentifier, integrationThreadId } =
          await getHubspotContextFromMessage(props);
        for (const item of (props as any).payload.items || []) {
          try {
            switch (item.type) {
              case "text":
                await hubSpotClient.sendMessage(
                  item.payload.text,
                  name,
                  contactIdentifier,
                  integrationThreadId,
                );
                break;
              case "markdown":
                await hubSpotClient.sendMessage(
                  item.payload.markdown,
                  name,
                  contactIdentifier,
                  integrationThreadId,
                );
                break;
              case "image": {
                const t = item.payload.text ? item.payload.text + " " : " ";
                await hubSpotClient.sendMessage(
                  t + item.payload.imageUrl,
                  name,
                  contactIdentifier,
                  integrationThreadId,
                );
                break;
              }
              case "video": {
                const t = item.payload.text ? item.payload.text + " " : " ";
                await hubSpotClient.sendMessage(
                  t + item.payload.videoUrl,
                  name,
                  contactIdentifier,
                  integrationThreadId,
                );
                break;
              }
              case "audio": {
                const t = item.payload.text ? item.payload.text + " " : " ";
                await hubSpotClient.sendMessage(
                  t + item.payload.audioUrl,
                  name,
                  contactIdentifier,
                  integrationThreadId,
                );
                break;
              }
              case "file": {
                const { fileUrl, title } = item.payload;
                const text = `${title ? title + ": " : ""}${fileUrl}`;
                await hubSpotClient.sendMessage(
                  text,
                  name,
                  contactIdentifier,
                  integrationThreadId,
                );
                break;
              }
            }
          } catch (err) {
            (props.logger || { forBot: () => ({ error: () => {} }) })
              .forBot()
              .error(
                "Failed to send bloc item to HubSpot: " +
                  (err as Error).message,
              );
          }
        }
      },
      file: async (props: bp.AnyMessageProps) => {
        const { hubSpotClient, name, contactIdentifier, integrationThreadId } =
          await getHubspotContextFromMessage(props);
        const { title, fileUrl } = (props.payload as any) || {};
        if (!fileUrl) {
          props.logger.forBot().error("No fileUrl provided for file message");
          throw new RuntimeError("No fileUrl provided for file message");
        }
        const text = `${title ? title + ": " : ""}${fileUrl}`;
        return await hubSpotClient.sendMessage(
          text,
          name,
          contactIdentifier,
          integrationThreadId,
        );
      },
      video: async (props: bp.AnyMessageProps) => {
        const { hubSpotClient, name, contactIdentifier, integrationThreadId } =
          await getHubspotContextFromMessage(props);
        const userMessage = (props.payload as any)?.text || " ";
        const videoUrl = (props.payload as any)?.videoUrl;
        const text = `${userMessage}${videoUrl ? " " + videoUrl : ""}`;
        return await hubSpotClient.sendMessage(
          text,
          name,
          contactIdentifier,
          integrationThreadId,
        );
      },
      audio: async (props: bp.AnyMessageProps) => {
        const { hubSpotClient, name, contactIdentifier, integrationThreadId } =
          await getHubspotContextFromMessage(props);
        const userMessage = (props.payload as any)?.text || " ";
        const audioUrl = (props.payload as any)?.audioUrl;
        const text = `${userMessage}${audioUrl ? " " + audioUrl : ""}`;
        return await hubSpotClient.sendMessage(
          text,
          name,
          contactIdentifier,
          integrationThreadId,
        );
      },
      image: async (props: bp.AnyMessageProps) => {
        const { hubSpotClient, name, contactIdentifier, integrationThreadId } =
          await getHubspotContextFromMessage(props);
        const userMessage = (props.payload as any)?.text || " ";
        const imageUrl = (props.payload as any)?.imageUrl;
        const text = `${userMessage}${imageUrl ? " " + imageUrl : ""}`;
        return await hubSpotClient.sendMessage(
          text,
          name,
          contactIdentifier,
          integrationThreadId,
        );
      },
      text: async (props: bp.AnyMessageProps) => {
        const { hubSpotClient, name, contactIdentifier, integrationThreadId } =
          await getHubspotContextFromMessage(props);
        const userMessage = (props.payload as any)?.text;
        return await hubSpotClient.sendMessage(
          userMessage,
          name,
          contactIdentifier,
          integrationThreadId,
        );
      },
    },
  },
} satisfies bp.IntegrationProps["channels"];
