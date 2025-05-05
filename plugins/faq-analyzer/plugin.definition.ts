import { PluginDefinition } from '@botpress/sdk'
import { pluginName } from './package.json'
import * as sdk from '@botpress/sdk'

export default new PluginDefinition({
  name: 'plus/faq-analyzer',
  version: '1.0.7',
  configuration: {
    schema: sdk.z.object({})
  },
  actions: {}
})
