import actions from './actions'
import { register, unregister, handler } from './setup'
import { channels } from './channels'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister,
  actions,
  handler,
  channels,
})
