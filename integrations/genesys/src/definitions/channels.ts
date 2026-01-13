import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const channels = {
  hitl: {
    conversation: {
      tags: {
        id: {
          title: 'Genesys Conversation ID',
          description: 'The external user ID used in Genesys Open Message.',
        },
        userId: {
          title: 'User ID',
          description: 'The ID of the user in Botpress',
        },
      },
    },
    messages: {
      text: {
        schema: z.object({
          text: z.string(),
        }),
      },
      image: {
        schema: z.object({
          imageUrl: z.string(),
        }),
      },
      file: {
        schema: z.object({
          fileUrl: z.string(),
          title: z.string().optional(),
        }),
      },
      video: {
        schema: z.object({
          videoUrl: z.string(),
          title: z.string().optional(),
        }),
      },
      choice: {
        schema: z.object({
          text: z.string(),
          options: z.array(z.object({ label: z.string(), value: z.string() })),
        }),
      },
    },
    message: {
      tags: {
        id: {},
        conversationId: {},
      },
    },
  },
  channel: {
    title: 'Genesys Messaging Channel',
    description: 'Direct messaging channel for bot conversations',
    conversation: {
      tags: {
        id: { title: 'Genesys Conversation ID' },
      },
    },
    messages: {
      text: { schema: z.object({ text: z.string() }) },
      image: { schema: z.object({ imageUrl: z.string() }) },
      file: { schema: z.object({ fileUrl: z.string(), title: z.string().optional() }) },
      video: { schema: z.object({ videoUrl: z.string(), title: z.string().optional() }) },
      choice: {
        schema: z.object({
          text: z.string(),
          options: z.array(z.object({ label: z.string(), value: z.string() })),
        }),
      },
    },
    message: {
      tags: {
        id: {},
        conversationId: {},
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
