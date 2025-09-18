import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from './definitions'

export default new IntegrationDefinition({
  name: 'plus/pipedrive',
  title: 'Pipedrive',
  description: 'Manage contacts, deals and more from your chatbot.',
  version: '3.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1).secret().describe('Your Pipedrive API Key'),
    }),
  },
  actions,
})
