import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const events = {
  hitlStarted: {
    title: 'HITL Started',
    description: 'Triggered when a HITL session started',
    schema: z.object({
      userId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      conversationId: z.string(),
    }),
  },
} satisfies IntegrationDefinitionProps['events']
