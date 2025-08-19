import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export const channels = {
  hitl: {
    conversation: {
      tags: {
        id: { title: 'LiveChat Conversation ID', description: 'LiveChat Conversation ID' },
        userId: { title: 'User ID', description: 'The ID of the user in Botpress' },
      },
    },
    messages: {
      text: {
        schema: z.object({
          text: z.string(),
        }),
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
