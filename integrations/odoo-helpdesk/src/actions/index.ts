import * as bp from '.botpress'
import * as tickets from './tickets'
import * as customers from './customers'

export default {
  ...tickets,
  ...customers,
} satisfies bp.IntegrationProps['actions']