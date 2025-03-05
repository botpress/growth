import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { ZohoConfigurationSchema } from './schemas'

export { channels } from './channels'

export const events = {} satisfies IntegrationDefinitionProps['events']

export const configuration = {
  schema: ZohoConfigurationSchema,
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
    credentials: {
      type: "integration",
      schema: z.object({
        accessToken: z.string(),
      }),
    },
    userInfo: {
      type: "integration",
      schema: z.object({
        email: z.string(),
        name: z.string(),
      })
    }
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    id: { description: 'Zoho Sales IQ User Id', title: 'Zoho Sales IQ User Id' },
  },
} satisfies IntegrationDefinitionProps['user']
