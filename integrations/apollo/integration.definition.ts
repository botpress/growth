import { IntegrationDefinition } from '@botpress/sdk'
import { actions } from './src/definitions/actions'
import { configuration } from './src/definitions/index'

export default new IntegrationDefinition({
  name: 'apollo',
  title: 'Apollo.io',
  version: '3.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: "Search for and enrich people from your team's Apollo.io account",
  configuration,
  actions,
})
