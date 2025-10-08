import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from 'definitions'

export default new IntegrationDefinition({
  name: 'max/persat',
  title: 'Persat',
  description: 'Connect with Persat to manage clients and form creation',
  version: '0.0.2',
  readme: 'hub.md',
  icon: 'icon.svg',

  configuration: {
    schema: z
      .object({
        APIKey: z.string().title('API Key').describe('Developer API token').min(1).secret(),
      })
      .required(),
  },
  actions,
})
