import * as bp from '.botpress'
import { HubSpotApi } from 'src/client'

export const handleOperatorReplied = async ({
  hubspotEvent,
  client,
  hubSpotClient,
}: {
  hubspotEvent: any
  client: bp.Client,
  hubSpotClient: HubSpotApi
}) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: hubspotEvent.message?.conversationsThreadId,
    },
  })

  let recipientActorId = hubspotEvent.message?.recipients?.[0]?.actorId
  
  // Stripping the "V-" prefix from the recipientActorId
  let recipientActorPhoneNumber = await hubSpotClient.getActorPhoneNumber(recipientActorId.substring(2))

  const { user } = await client.getOrCreateUser({
    tags: {
      id: recipientActorPhoneNumber,
    },
  })

  await client.createMessage({
    tags: {},
    type: 'text',
    userId: user?.id as string,
    conversationId: conversation.id,
    payload: { text: hubspotEvent.message?.text },
  })
}
