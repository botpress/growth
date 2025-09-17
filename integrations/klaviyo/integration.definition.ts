import { IntegrationDefinition, z } from "@botpress/sdk";
import { actions } from "./definitions";

export default new IntegrationDefinition({
  name: "plus/klaviyo",
  title: "Klaviyo",
  description:
    "Manage customer profiles, generate leads, and curate marketing campaigns",
  version: "1.0.0",
  readme: "hub.md",
  icon: "icon.svg",
  configuration: {
    schema: z.object({
      apiKey: z
        .string()
        .min(1)
        .secret()
        .title("API Key")
        .describe("Your Klaviyo Private API Key"),
    }),
  },
  actions,
});
