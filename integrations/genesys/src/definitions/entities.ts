import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const entities = {
  ticket: {
    title: 'Ticket',
    description: 'A HITL ticket/session',
    schema: z.object({}),
  },
} satisfies IntegrationDefinitionProps['entities']
