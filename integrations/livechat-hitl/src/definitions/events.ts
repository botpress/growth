import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const hitlStarted = {
  title: 'HITL Started',
  description: 'Triggered when a HITL Session started',
  schema: z.object({
    userId: z.string(),
    title: z.string(),
    description: z.optional(z.string()),
    conversationId: z.string(),
  }),
}

export const events = {
  hitlStarted,
} as const satisfies IntegrationDefinitionProps['events']
