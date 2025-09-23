import * as bp from '.botpress'
import { ContactActions } from './contacts'
import { LeadActions } from './leads'
import { ApiActions } from './api'
import { CaseActions } from './cases'

export const actions = {
  ...ContactActions,
  ...LeadActions,
  ...ApiActions,
  ...CaseActions,
} satisfies bp.IntegrationProps['actions']
