import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const states = {
  userInfo: {
    type: 'user',
    schema: z.object({
      externalUserId: z.string(),
      nickname: z.string().optional(),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
