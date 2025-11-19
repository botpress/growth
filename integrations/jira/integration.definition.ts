import { IntegrationDefinition } from '@botpress/sdk'

import { configuration, states, user, channels, actions } from './src/definitions'

export default new IntegrationDefinition({
  name: 'plus/jira',
  title: 'Jira',
  description: 'This integration allows you to manipulate Jira issues and users.',
  version: '0.2.3',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  channels,
  user,
  actions,
  events: {},
  states,
})
