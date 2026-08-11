import * as sdk from '@botpress/sdk'
import { actions as customerActions } from './customers'
import { actions as ticketsActions } from './tickets'
import { actions as helpdeskActions } from './helpdesk'

export const actions = {
  ...customerActions,
  ...ticketsActions,
  ...helpdeskActions,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
