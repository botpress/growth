import { getClient } from '../client';
import { RuntimeError } from '@botpress/client';
import * as bp from '.botpress'

export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({ ctx, client, logger, input }) => {
  const zohoClient = getClient(
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  );

  try {
    const { state } = await client.getState({
      id: ctx.integrationId,
      name: "userInfo",
      type: "integration",
    });

    const { title, description = "No description available" } = input

    const result = await zohoClient.createConversation(state.payload.name, state.payload.email, title, description);

    const { conversation } = await client.getOrCreateConversation({
      channel: 'hitl',
      tags: {
        id: `${result.data.conversation_id}`,
      },
    })
    
    logger.forBot().debug(`Result Data - ${JSON.stringify(result, null, 2)}`);
    logger.forBot().debug(`Conversation ID - ${result.data.conversation_id}`);

    return {
      conversationId: conversation.id
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    logger.forBot().error(`'Create Conversation' exception: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
      data: null,
      conversationId: "error_conversation_id",
    };
  }
};

export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({ ctx, input, client, logger }) => {
  const { conversation } = await client.getConversation({
    id: input.conversationId,
  })

  const salesIqConversationId: string | undefined = conversation.tags.id

  if (!salesIqConversationId) {
    return {}
  }

  const zohoClient = getClient(
    ctx.configuration.refreshToken,
    ctx.configuration.clientId,
    ctx.configuration.clientSecret,
    ctx.configuration.dataCenter,
    ctx,
    client
  );

  void zohoClient.sendMessage(
    salesIqConversationId,
    'Botpress HITL terminated with reason: ' + input.reason
  )

  return {}
}

export const createUser: bp.IntegrationProps['actions']['createUser'] = async ({ client, input, ctx, logger }) => {
  try {
    const { name = "None", email = "None", pictureUrl = "None" } = input;

    if (!email) {
      logger.forBot().error('Email necessary for HITL')
      throw new RuntimeError('Email necessary for HITL')
    }

    await client.setState({
      id: ctx.integrationId,
      type: "integration",
      name: 'userInfo',
      payload: {
        name: name,
        email: email,
      },
    });

    const { user: botpressUser } = await client.getOrCreateUser({
      name,
      pictureUrl,
      tags: {
        id: email,
      }, 
    })

    logger.forBot().error(botpressUser)

    return {
      userId: botpressUser.id, 
    }
  } catch (error: any) {
    throw new RuntimeError(error.message)
  }
}
