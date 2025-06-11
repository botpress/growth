import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { LiveChatConfigurationSchema } from './schemas'

export { channels } from './channels'

export { events } from './events'

export const configuration = {
  schema: LiveChatConfigurationSchema,
} as const satisfies IntegrationDefinitionProps['configuration']

export const states = {
  userInfo: {
    type: "user",
    schema: z.object({
      email: z.string(),
    }),
  }
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    email: { description: 'LiveChat Email', title: 'LiveChat Email' },
    agentId: { description: 'LiveChat Agent Id', title: 'LiveChat Agent Id' },
    livechatConversationId: { description: 'LiveChat Conversation Id', title: 'LiveChat Conversation Id' },
    customerAccessToken: { description: 'LiveChat Customer Access Token', title: 'LiveChat Customer Access Token' },
  },
} satisfies IntegrationDefinitionProps['user']
