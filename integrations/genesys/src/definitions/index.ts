import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { GenesysConfigurationSchema } from './schemas'
import { channels } from './channels'

export const configuration = {
  schema: GenesysConfigurationSchema,
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  userInfo: {
    type: 'user',
    schema: z.object({
      externalUserId: z.string(),
      nickname: z.string().optional(),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export { events } from './events'
export { channels }

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
  },
} satisfies IntegrationDefinitionProps['user']
