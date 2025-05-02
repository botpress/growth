import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { Client } from '@botpress/client'
import { TABLE_NAME, TABLE_SCHEMA } from './schemas/table'

const getClient = (botClient: bp.Client): Client => (botClient as any)._client as Client
export default new bp.Integration({
  register: async ({ client, ctx, logger }) => {
    try {
      logger.forBot().info('Starting up...')
      const botpressClient = getClient(client)
      await botpressClient.getOrCreateTable({
        table: TABLE_NAME,
        schema: TABLE_SCHEMA
      })
      logger.forBot().info('Registered table')
    } catch (error) {
      logger.forBot().error('Error registering table', error)
    }
  },
  unregister: async ({ logger, client, ctx }) => {
    logger.forBot().info('Unregistering...')
    const botpressClient = getClient(client)
    try {
      await botpressClient.deleteTable({
        table: TABLE_NAME
      })
      logger.forBot().info('Unregistered table')
    } catch (error) {
      logger.forBot().error('Error unregistering table', error)
    }
  },
  actions: {},
  channels: {},
  handler: async ({ req, client, ctx, logger }) => {
    if (req.method !== 'POST') {
      return {
        status: 405,
        body: JSON.stringify({
          success: false,
          message: 'Method not allowed'
        })
      }
    }
  },
})
