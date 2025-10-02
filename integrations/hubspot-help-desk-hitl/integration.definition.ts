import { IntegrationDefinition, z } from "@botpress/sdk";
import { integrationName } from "./package.json";
import hitl from "./bp_modules/hitl";
import {
  events,
  configuration,
  states,
  channels,
  user,
} from "./src/definitions";

export default new IntegrationDefinition({
  name: integrationName,
  title: "HubSpot Help Desk HITL",
  version: "3.0.0",
  icon: "icon.svg",
  description:
    "This integration allows your bot to use HubSpot as a HITL provider. Messages will appear in HubSpot Help Desk.",
  readme: "hub.md",
  configuration,
  states,
  channels,
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
      title: "HubSpot Help Desk",
      description: "HubSpot Help Desk HITL",
      conversation: {
        tags: {
          id: {
            title: "HubSpot Help Desk Conversation Id",
            description: "HubSpot Help Desk Conversation Id",
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
