import { IntegrationDefinitionProps } from '@botpress/sdk'

/**
 * Defines the tags that can be associated with a Botpress user.
 * For Genesys, the user's external ID is used.
 */
export const user = {
  tags: {
    id: {
      title: 'Genesys External User ID',
      description: "The user's external ID used in Genesys Open Message.",
    },
    genesysConversationId: {
      title: 'Genesys Conversation ID',
      description: 'The Genesys conversation ID associated with this user.',
    },
    genesysAgentId: {
      title: 'Genesys Agent ID',
      description: 'The Genesys agent ID for agents responding to customers.',
    },
  },
} satisfies IntegrationDefinitionProps['user']
