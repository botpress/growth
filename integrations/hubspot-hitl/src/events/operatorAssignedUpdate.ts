import * as bp from '.botpress'
import { HubSpotApi } from 'src/client'

export const handleOperatorAssignedUpdate = async ({
  hubspotEvent,
  client,
  hubSpotClient,
}: {
  hubspotEvent: any
  client: bp.Client
  hubSpotClient: HubSpotApi
}) => {
  let threadInfo = await hubSpotClient.getThreadInfo(hubspotEvent.objectId)
  let recipientActorPhoneNumber = await hubSpotClient.getActorPhoneNumber(threadInfo.associatedContactId)

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: threadInfo.id,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      phoneNumber: recipientActorPhoneNumber,
    },
  })

  await client.createEvent({
    type: 'hitlAssigned',
    payload: {
      conversationId: conversation.id,
      userId: user.id as string,
    },
  })
}
