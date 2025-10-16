import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, states } from './src/definitions/index'

export default new IntegrationDefinition({
  name: 'plus/sharepoint',
  version: '3.1.1',
  title: 'SharePoint',
  description: 'Sync one or many SharePoint document libraries with one or more Botpress knowledge bases.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  states,
  actions: {},
})
