import * as bp from '.botpress'
import * as ticketsActions from './tickets'
import * as customersActions from './customers'
import * as helpdeskActions from './helpdesk'

export default {
  ...ticketsActions,
  ...customersActions,
  ...helpdeskActions,
} satisfies bp.IntegrationProps['actions']
