import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: {
    extractTgz: {
      input: {
        schema: z.object({
          fileUrl: z.string().url().describe('URL of the .tgz file to download and extract'),
        }),
      },
      output: {
        schema: z.object({
          files: z.array(z.string()).describe('List of file paths extracted from the .tgz file'),
        }),
      },
    },
  },
  secrets: {},
  entities: {},
})
