import { IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration, states } from './definitions/index'

export default new IntegrationDefinition({
  name: 'max/sharepoint',
  version: '3.1.1',
  title: 'SharePoint',
  description: 'Sync one or many SharePoint document libraries with one or more Botpress knowledge bases.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  states,
  actions,
})
