import { IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'
import { configuration, actions, events, states } from './src/definitions'

export default new IntegrationDefinition({
  name: integrationName,
  version: '1.1.5',
  title: 'Google Sheets Public Sync',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
  events,
  states,
})
