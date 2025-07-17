import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, states, actions, events } from './src/definitions/index'

export default new IntegrationDefinition({
  name: 'plus/shopify-products-sync',
  title: 'Shopify products sync',
  version: '1.5.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Sync products from Shopify to Botpress Knowledge Base',
  configuration,
  actions,
  states,
  events
})
