import syncProducts from './sync-products'
import syncKb from './sync-kb'
import * as bp from '.botpress'

export default {
  syncProducts,
  syncKb,
} satisfies bp.IntegrationProps['actions']
