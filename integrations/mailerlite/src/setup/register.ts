import { getAuthenticatedMailerLiteClient } from 'src/client';
import { validateCredentials } from 'src/auth';
import * as bp from '.botpress';

export const register: bp.IntegrationProps['register'] = async ({
  ctx,
  client,
  webhookUrl,
  logger,
}) => {
  try {
    await validateCredentials({ ctx, client });
    logger.forBot().info('MailerLite integration registered successfully');
  } catch (error) {
    logger.forBot().error('Failed to register MailerLite integration', error);
    throw error;
  }

  const mlClient = await getAuthenticatedMailerLiteClient({ ctx, client });

  const params = {
    name: 'Webhook',
    events: ['subscriber.created'],
    url: webhookUrl,
  };

  const { state } = await client.getOrSetState({
    type: 'integration',
    name: 'mailerLiteIntegrationInfo',
    id: ctx.integrationId,
    payload: { mailerLiteWebhookId: '' },
  });

  if (!state.payload?.mailerLiteWebhookId) {
    const created = await mlClient.webhooks.create(params);
    const mailerLiteWebhookId = String(created.data.data.id);
    logger.forBot().debug('Webhook created.');

    await client.setState({
      type: 'integration',
      name: 'mailerLiteIntegrationInfo',
      id: ctx.integrationId,
      payload: { mailerLiteWebhookId },
    });
  }
};
