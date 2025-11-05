import { z } from '@botpress/sdk'

export const BrevoConfigurationSchema = z.object({
  apiKey: z.string().title('API Key').describe('Your Brevo API Key (v3)'),
  agentId: z.string().min(1).title('Agent ID').describe('The Brevo Agent ID for messages sent from the bot (Required)'),
})
