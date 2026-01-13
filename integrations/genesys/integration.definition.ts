import { IntegrationDefinition } from '@botpress/sdk'
import hitl from './bp_modules/hitl'
import { configuration, user, states, events, channels, entities } from './src/definitions'

export default new IntegrationDefinition({
  name: 'genesys-hitl',
  title: 'Genesys HITL',
  version: '1.6.0',
  readme: 'hub.md',
  description: 'Genesys Cloud HITL Integration for Open Message',
  icon: 'icon.svg',
  configuration,
  states,
  events,
  user,
  channels,
  entities,
}).extend(hitl, (self) => ({
  entities: {
    hitlSession: self.entities.ticket,
  },
  channels: {
    hitl: {
      title: 'Genesys HITL',
      description: 'Genesys Cloud Open Message HITL Channel',
    },
  },
}))
