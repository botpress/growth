import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, states, actions, events } from './src/definitions/index'

export default new IntegrationDefinition({
  name: 'plus/shopify-products-sync',
  title: 'Shopify products sync',
  version: '2.0.5',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Sync products from Shopify to Botpress Knowledge Base and Table',
  configuration,
  actions,
  states,
  events
})
