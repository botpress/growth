import { PluginDefinition } from '@botpress/sdk'
import { pluginName } from './package.json'
import * as sdk from '@botpress/sdk'

export default new PluginDefinition({
  name: 'plus/faq-analyzer',
  version: '1.0.8',
  configuration: {
    schema: sdk.z.object({
      tableName: sdk.z.string()
        .min(1, { message: 'Table name is required' })
        .regex(/^[^\d]/, { message: 'Table name must not start with a number' })
    })
  },
  actions: {}
})
