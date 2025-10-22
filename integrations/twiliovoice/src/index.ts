import * as bp from '.botpress'
import * as bpclient from '@botpress/client'
import handleIncoming from './handleIncoming'
import handleOutgoing from './handleOutgoing'
import { Twilio, twiml } from 'twilio'

const integration = new bp.Integration({
  register: async ({ ctx, logger }) => {
    logger.forBot().info('registering')
    if (!ctx.configuration.accountSID) {
      throw new bpclient.RuntimeError(
        'Configuration Error! Account SID is not set. Please set it in your bot integration configuration.'
      )
    }

    if (!ctx.configuration.authToken) {
      throw new bpclient.RuntimeError(
        'Configuration Error! Account SID is not set. Please set it in your bot integration configuration.'
      )
    }
    try {
      new Twilio(ctx.configuration.accountSID, ctx.configuration.authToken)
    } catch (e) {
      throw new bpclient.RuntimeError('Configuration error! Failed to verify accountSID and authToken')
    }
  },
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: handleOutgoing,
      },
    },
  },
  handler: handleIncoming,
})

export default integration
