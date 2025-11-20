import { IntegrationDefinition } from '@botpress/sdk'

import { configuration, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: 'plus/jira',
  title: 'Jira',
  description: 'This integration allows you to manipulate Jira issues and users.',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
  events: {},
})
