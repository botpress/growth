import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const hitlStarted = {
  title: 'HITL Started',
  description: 'Triggered when a HITL Session started',
  schema: z.object({
    userId: z
      .string()
      .describe('The Botpress user ID of the user who started the HITL session')
      .title('Botpress User ID'),
    title: z.string().describe('The title of the HITL ticket').title('HITL Ticket Title'),
    description: z.optional(z.string()).describe('The description of the HITL ticket').title('HITL Ticket Description'),
    conversationId: z.string().describe('The Botpress conversation ID').title('Botpress Conversation ID'),
  }),
}

export const events = {
  hitlStarted,
} as const satisfies IntegrationDefinitionProps['events']
