import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { MessagingSessionSchema, SFMessagingConfigSchema } from './schemas'

export { channels } from './channels'
export { events } from './events'
export { actions } from './actions'

export const configuration = {
  schema: SFMessagingConfigSchema,
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  messaging: {
    type: 'conversation',
    schema: MessagingSessionSchema,
  },
} satisfies IntegrationDefinitionProps['states']
