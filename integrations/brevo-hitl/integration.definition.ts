import { IntegrationDefinition, z } from "@botpress/sdk";
import hitl from "./bp_modules/hitl";
import {
  events,
  configuration,
  channels as baseChannels,
  states,
  user,
} from "./src/definitions";

export default new IntegrationDefinition({
  name: "plus/brevo-hitl",
  title: "Brevo HITL",
  version: "2.0.0",
  readme: "hub.md",
  description: "Brevo HITL Integration",
  icon: "icon.svg",
  configuration,
  states,
  channels: baseChannels,
  events,
  user,
  entities: {
    ticket: {
      schema: z.object({}),
    },
  },
}).extend(hitl, (self) => ({
  entities: {
    hitlSession: self.entities.ticket,
  },
  channels: {
    hitl: {
      title: "Brevo",
      description: "Brevo HITL",
      conversation: {
        tags: {
          id: {
            title: "Brevo Conversation Id",
            description: "Brevo Conversation Id",
          },
          userId: {
            title: "User ID",
            description: "The ID of the user in Botpress",
          },
        },
      },
    },
  },
}));
