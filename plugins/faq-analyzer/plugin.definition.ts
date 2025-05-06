import { PluginDefinition } from '@botpress/sdk'
import { pluginName } from './package.json'
import * as sdk from '@botpress/sdk'

export default new PluginDefinition({
  name: 'plus/faq-analyzer',
  version: '1.1.0',
  configuration: {
    schema: sdk.z.object({
      tableName: sdk.z.string()
        .title('Table Name')
        .describe('The name of the table to store the FAQ data. Do not start your table name with a number.')
        .min(1, { message: 'Table name is required' })
        .regex(/^[^\d]/, { message: 'Table name must not start with a number' })
    })
  },
  actions: {}
})
