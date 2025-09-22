import { IntegrationDefinition } from "@botpress/sdk";
import { integrationName } from "./package.json";
import { actions, events, states } from "src/definitions/index";

export default new IntegrationDefinition({
  name: integrationName,
  version: "1.0.0",
  readme: "hub.md",
  icon: "icon.svg",
  secrets: {
    AWS_REGION: {
      description: "AWS Region",
    },
    AWS_ACCESS_KEY_ID: {
      description: "AWS Access Key ID",
    },
    AWS_SECRET_ACCESS_KEY: {
      description: "AWS Secret Access Key",
    },
  },
  actions,
  states,
  events,
});
