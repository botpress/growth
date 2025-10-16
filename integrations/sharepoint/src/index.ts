import * as bp from '.botpress'
import actions from './actions'
import { register, unregister } from './setup'
import { handler } from './handler'

export default new bp.Integration({
  register,
  unregister,
  actions,
  handler,
  channels: {},
})
