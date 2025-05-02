import { PluginDefinition } from '@botpress/sdk'
import { pluginName } from './package.json'
import * as sdk from '@botpress/sdk'

export default new PluginDefinition({
  name: 'plus/faq-analyzer',
  version: '1.0.1',
  configuration: {
    schema: sdk.z.object({
      tableName: sdk.z.string().title('Table Name').describe('The name of the table that will hold your faq data'),
    })
  },
  actions: {}
})
