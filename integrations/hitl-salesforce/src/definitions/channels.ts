import {IntegrationDefinitionProps, messages} from '@botpress/sdk'

export const channels = {
  hitl: {
    title: 'Salesforce LiveAgent',
    messages: {
      text: messages.defaults.text,
      audio: messages.defaults.audio,
      file: messages.defaults.file,
      image: messages.defaults.image,
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
        closedAt: {
          title: 'Closed at',
          description: 'When the conversation was marked as closed',
        },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
