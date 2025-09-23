import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    apiKey: z
      .string({
        description: 'Your Apollo.io API Key',
      })
      .min(1), 
  }),
} satisfies IntegrationDefinitionProps['configuration']
