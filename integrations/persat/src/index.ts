import actions from './actions'
import * as bp from '.botpress'
import { register } from './setup'

export default new bp.Integration({
  register,
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {},
})
