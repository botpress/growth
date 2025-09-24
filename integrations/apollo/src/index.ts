import * as bp from '.botpress'
import { register, unregister } from './setup'
import actions from './actions'

export default new bp.Integration({
  register,
  unregister,
  actions,
  channels: {},
  handler: async () => {},
})
