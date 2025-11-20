import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from '@botpress/sdk'

export { actions } from './actions'

export const configuration = {
  schema: z.object({
    host: z.string().title('Host').describe('Atlassian Host Domain (e.g. yourcompany.atlassian.net)'),
    email: z.string().title('Email').describe('Email in Atlassian Account'),
    apiToken: z.string().title('API Token').describe('API Token'),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  // voidStateOne: {
  //   type: 'integration',
  //   schema: z.object({
  //     dataField: z.string(),
  //   }),
  // },
  // voidStateTwo: {
  //   type: 'conversation',
  //   schema: z.object({
  //     otherDataField: z.string(),
  //   }),
  // },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    // id: {},
  },
} satisfies IntegrationDefinitionProps['user']
