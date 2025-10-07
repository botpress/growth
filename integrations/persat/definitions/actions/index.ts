import * as sdk from '@botpress/sdk'
import { actions as clientActions } from './client'

export const actions = {
  ...clientActions,
} as const satisfies sdk.IntegrationDefinitionProps['actions']
