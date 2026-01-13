import * as sdk from '@botpress/sdk'
import {actions as customerActions} from './customers'
import {actions as ticketActions} from './tickets'

export const actions = {
  ...customerActions,
  ...ticketActions,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
