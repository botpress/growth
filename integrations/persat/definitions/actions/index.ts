import * as sdk from '@botpress/sdk'
import { actions as clientActions } from './client'
import { actions as formActions } from './form'

export const actions = {
  ...clientActions,
  ...formActions,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
