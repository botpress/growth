import * as bp from '.botpress'
import { RuntimeError } from '@botpress/sdk'
import { getApiAccessToken, getProfile } from '../client'

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, logger }) => {
  logger.forBot().info('Registering Chatwoot integration...')

  const apiAccessToken = getApiAccessToken(ctx)
  const accountId = ctx.configuration.accountId

  const profile = await getProfile(apiAccessToken)
  const account = profile.accounts.find((account) => account.id.toString() === accountId)
  if (!account) {
    throw new RuntimeError('Account not found')
  }

  await client.setState({
    type: 'integration',
    name: 'registerChatwootAccount',
    id: ctx.integrationId,
    payload: { accountId: accountId },
  })

  logger.forBot().info('Chatwoot integration registered successfully')
}
