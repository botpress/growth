import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  channel: {
    title: 'Channel',
    description: 'Jira integration channel for receiving messages',
    messages: { ...messages.defaults },
  },
} satisfies IntegrationDefinitionProps['channels']
