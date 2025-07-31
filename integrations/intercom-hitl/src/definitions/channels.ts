import { IntegrationDefinitionProps, z } from "@botpress/sdk";

export const channels = {
  hitl: {
    conversation: {
      tags: {
        id: {
          title: "Intercom Conversation Id",
          description: "Intercom Conversation Id",
        },
        userId: {
          title: "User ID",
          description: "The ID of the user in Botpress",
        },
      },
    },
    messages: {
      text: {
        schema: z.object({
          text: z.string(),
        }),
      },
    },
  },
} satisfies IntegrationDefinitionProps["channels"];
