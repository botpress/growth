import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { getProfile } from '../client'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, logger }) => {
  logger.forBot().info('Registering Chatwoot integration...')

  const profile = await getProfile(ctx)
  const accounts = profile.accounts

  if (!accounts?.length) {
    throw new RuntimeError('No Chatwoot accounts found')
  }

  await client.setState({
    type: 'integration',
    name: 'integration',
    id: ctx.integrationId,
    payload: { accountId: accounts[0]!.id.toString() },
  })

  logger.forBot().info('Chatwoot integration registered successfully')
}
