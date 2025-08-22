import { z } from "@botpress/sdk";

export const BrevoConfigurationSchema = z.object({
  apiKey: z.string().describe("Your Brevo API Key (v3)"),
  agentId: z
    .string()
    .min(1)
    .describe("The Brevo Agent ID for messages sent from the bot (Required)"),
});
