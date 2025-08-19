import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { IntercomConfigurationSchema } from './schemas'

export { channels } from './channels'

export { events } from './events'

export const configuration = {
  schema: IntercomConfigurationSchema,
} as const satisfies IntegrationDefinitionProps['configuration']

export const states = {
  intercomContact: {
    type: "conversation",
    schema: z.object({
      intercomContactId: z.string(),
    }),
  },
  userInfo: {
    type: "user",
    schema: z.object({
      email: z.string(),
      intercomContactId: z.string(),
    }),
  }
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    email: { description: 'Intercom Email', title: 'Intercom Email' },
    intercomAdminId: { description: 'Intercom Admin ID', title: 'Intercom Admin ID' },
    intercomConversationId: { description: 'Intercom Conversation ID', title: 'Intercom Conversation ID' }
  },
} satisfies IntegrationDefinitionProps['user']
