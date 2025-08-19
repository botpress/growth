import { IntegrationDefinition } from "@botpress/sdk";
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
  title: "HubSpot Inbox HITL",
  version: "4.0.3",
  icon: "icon.svg",
  description:
    "This integration allows your bot to use HubSpot as a HITL provider. Messages will appear in HubSpot Inbox.",
  readme: "hub.md",
  configuration,
  states,
  channels,
  events,
  user,
}).extend(hitl, () => ({
  entities: {},
  channels: {
    hitl: {
      title: "HubSpot",
      description: "HubSpot Inbox HITL",
      conversation: {
        tags: {
          id: {
            title: "HubSpot Conversation Id",
            description: "HubSpot Conversation Id",
          },
        },
      },
    },
  },
}));
