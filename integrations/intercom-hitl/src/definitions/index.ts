import { z, IntegrationDefinitionProps } from "@botpress/sdk";
import { IntercomConfigurationSchema } from "./schemas";

export { channels } from "./channels";

export { events } from "./events";

export const configuration = {
  schema: IntercomConfigurationSchema,
} as const satisfies IntegrationDefinitionProps["configuration"];

export const states = {
  intercomContact: {
    type: "conversation",
    schema: z.object({
      intercomContactId: z.string(),
    }),
  },
  userInfo: {
    type: "user",
    schema: z.object({
      email: z.string(),
      intercomContactId: z.string(),
    }),
  },
} satisfies IntegrationDefinitionProps["states"];

export const user = {
  tags: {
    email: { description: "Intercom Email", title: "Intercom Email" },
    intercomAdminId: {
      description: "Intercom Admin Id",
      title: "Intercom Admin Id",
    },
    intercomConversationId: {
      description: "Intercom Conversation Id",
      title: "Intercom Conversation Id",
    },
  },
} satisfies IntegrationDefinitionProps["user"];
