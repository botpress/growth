import { getClient } from 'src/client'
import * as bpclient from '@botpress/client'
import type { RegisterFunction } from '../misc/types'

export const register: RegisterFunction = async ({ ctx, client, logger }) => {
  logger.forBot().info('Registering configuration...')

  try {
    const hubspotClient = getClient(
      ctx,
      client,
      ctx.configuration.refreshToken,
      ctx.configuration.clientId,
      ctx.configuration.clientSecret,
      logger
    )

    await hubspotClient.refreshAccessToken()

    const channelName = 'Botpress Channel'

    const newChannelId = await hubspotClient.createCustomChannel(
      ctx.configuration.developerApiKey,
      ctx.configuration.appId
    )

    logger.forBot().info(`Created custom channel with ID: ${newChannelId}`)

    // Retry loop with exponential backoff (up to 1 minute)
    let channelExists = false
    let attempt = 0
    let maxAttempts = 6 // 1s, 2s, 4s, 8s, 16s, 32s = total ~63s

    while (attempt < maxAttempts) {
      const channels = await hubspotClient.getCustomChannels()

      channelExists = channels.results.some((channel: any) => channel.id === newChannelId)

      if (channelExists) {
        logger.forBot().info(`Channel ID ${newChannelId} found in channel list after ${attempt + 1} attempt(s).`)
        break
      }

      const delay = Math.pow(2, attempt) * 1000
      logger.forBot().warn(`Channel ID ${newChannelId} not found yet. Retrying in ${delay / 1000}s...`)
      await sleep(delay)
      attempt++
    }

    let connectChannel = await hubspotClient.connectCustomChannel(newChannelId, ctx.configuration.inboxId, channelName)
    logger.forBot().info('Connected new custom channel to inbox.')

    // Save channelId to integration state
    await client.setState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'channelInfo',
      payload: {
        channelId: newChannelId,
        channelAccountId: connectChannel.data.id,
      },
    })

    logger.forBot().info('HubSpot Inbox configuration validated successfully.')
  } catch (error) {
    logger.forBot().error('Error during integration registration:', error)
    throw new bpclient.RuntimeError('Configuration Error! Unable to retrieve app details.')
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
