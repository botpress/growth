import { getAuthenticatedMailerLiteClient } from 'src/client';
import * as bp from '.botpress';
import { RuntimeError } from '@botpress/client';

export const register: bp.IntegrationProps['register'] = async ({ ctx, client, webhookUrl, logger }) => {
  const mlClient = await getAuthenticatedMailerLiteClient({ ctx, client });

  try {
    await mlClient.subscribers.get({ limit: 1 });
    logger.forBot().info('MailerLite integration registered successfully');
  } catch (error) {
    logger.forBot().error('Failed to register MailerLite integration', error);

    throw new RuntimeError(
      'Failed to validate MailerLite API key. Please confirm the key is correct and has the necessary permissions.'
    );
  }

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
