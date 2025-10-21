import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const states = {
  configuration: {
    type: 'integration',
    schema: z.object({
      // key = documentLibraryName, value = {webhookSubscriptionId,changeToken}
      subscriptions: z.record(
        z.object({
          webhookSubscriptionId: z.string().min(1),
          changeToken: z.string().min(1),
        })
      ),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
