import actions from './actions'
import channels from './channels'
import { handler } from './handler'
import { register } from './setup'
import * as bp from '.botpress'

export default new bp.Integration({
  register,
  unregister: async ({}) => {},
  actions,
  channels,
  handler,
})
