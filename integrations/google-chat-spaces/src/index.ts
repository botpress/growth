import * as bp from '.botpress'
import { register, unregister, handler } from './setup'
import actions from './actions'
import { channels } from './channels'

export default new bp.Integration({
  register,
  unregister,
  actions,
  handler,
  channels,
})
