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

    let existingChannelId: string | null = null

    try {
      const { state } = await client.getState({
        id: ctx.integrationId,
        name: 'channelInfo',
        type: 'integration',
      })

      if (state?.payload?.channelId && state?.payload?.channelAccountId) {
        existingChannelId = state.payload.channelId
        logger.forBot().info(`Found existing channel in state: ${existingChannelId}`)
      }
    } catch (error) {
      logger.forBot().info('No existing channel state found.')
    }

    if (existingChannelId) {
      const channels = await hubspotClient.getCustomChannels()
      const channelExists = channels.results.some((channel: any) => channel.id === existingChannelId)

      if (channelExists) {
        logger.forBot().info(`Existing channel ${existingChannelId} verified in HubSpot. Skipping channel creation.`)
        logger.forBot().info('Hubspot configuration validated successfully.')
        return
      } else {
        logger.forBot().warn(`Stored channel ${existingChannelId} not found in HubSpot. Will create new channel.`)
      }
    }

    const channelName = 'Botpress Channel'

    const newChannelId = await hubspotClient.createCustomChannel(
      ctx.configuration.developerApiKey,
      ctx.configuration.appId
    )

    logger.forBot().info(`Created custom channel with ID: ${newChannelId}`)

    let channelExists = false
    let attempt = 0
    let maxAttempts = 6 

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

    if (!channelExists) {
      logger.forBot().warn(`Channel ID ${newChannelId} not found in list after retries.`)
    }

    const connectedChannel = await hubspotClient.connectCustomChannel(
      newChannelId,
      ctx.configuration.helpDeskId,
      channelName
    )
    logger.forBot().info('Connected new custom channel to help desk.')
    await client.setState({
      id: ctx.integrationId,
      type: 'integration',
      name: 'channelInfo',
      payload: {
        channelId: newChannelId,
        channelAccountId: connectedChannel.data.id,
      },
    })

    logger.forBot().info('Hubspot configuration validated successfully.')
  } catch (error) {
    logger.forBot().error('Error during integration registration:', error)
    throw new bpclient.RuntimeError('Configuration Error! Unable to retrieve app details.')
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
