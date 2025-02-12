import { messages, IntegrationDefinitionProps } from '@botpress/sdk'

export const channels = {
  hitl: {
    title: 'Salesforce LiveAgent',
    messages: {
      text: messages.defaults.text,
      image: messages.defaults.image,
      file: messages.defaults.file,
      audio: messages.defaults.audio,
      video: messages.defaults.video,
    },
    conversation: {
      tags: {
        transportKey: {
          title: 'Key for SSE',
          description: 'Key from the TT service used to identify the SSE session',
        },
        id: {
          title: 'Salesforce Conversation ID',
          description: 'Conversation ID from Salesforce Messaging',
        },
        assignedAt: {
          title: 'Assigned at',
          description: 'When the conversation was assigned to an Agent',
        },
        closedAt: {
          title: 'Closed at',
          description: 'When the conversation was marked as closed',
        },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
