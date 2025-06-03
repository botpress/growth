import { z, IntegrationDefinitionProps } from '@botpress/sdk'
// Import the new Brevo configuration schema
import { BrevoConfigurationSchema } from './schemas'
// Channels are typically defined in their own file and imported
import { channels } from './channels'

export const configuration = {
  schema: BrevoConfigurationSchema, // Use the Brevo-specific schema
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  userInfo: {
    type: "user",
    schema: z.object({
      email: z.string(),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export { events } from './events'

export { channels }

/**
 * Defines the tags that can be associated with a Botpress user.
 * For Brevo, the user's email is used as the `visitorId`.
 */
export const user = {
  tags: {
    id: {
      title: 'Brevo Visitor ID (Email)',
      description: "The user's email address, used as the visitorId in Brevo.",
    },
    // You could add other Brevo-specific user tags if needed
    // brevoContactId: {
    //   title: 'Brevo Contact ID',
    //   description: 'The ID of the contact in Brevo CRM (if applicable)'
    // }
  },
} satisfies IntegrationDefinitionProps['user']