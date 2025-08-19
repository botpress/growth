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
  title: "LiveChat HITL",
  version: "2.0.1",
  icon: "icon.svg",
  description:
    "This integration allows your bot to use LiveChat as a HITL provider. Messages will appear in LiveChat.",
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
      title: "LiveChat",
      description: "LiveChat HITL",
      conversation: {
        tags: {
          id: {
            title: "LiveChat Conversation Id",
            description: "LiveChat Conversation Id",
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
