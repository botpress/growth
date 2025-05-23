import { OperatorAssignedUpdateParams, ThreadInfo } from '../misc/types'

export const handleOperatorAssignedUpdate = async ({
  hubspotEvent,
  client,
  hubSpotClient,
  logger,
}: OperatorAssignedUpdateParams) => {
  let threadInfo: ThreadInfo = await hubSpotClient.getThreadInfo(hubspotEvent.objectId)
  
  // Get the contact ID and determine if we need email or phone
  const contactId = threadInfo.associatedContactId
  const isEmail = threadInfo.senders?.[0]?.deliveryIdentifier?.type === "HS_EMAIL_ADDRESS"
  
  // Get only the identifier we need based on what was used to create the conversation
  const contactIdentifier = isEmail 
    ? await hubSpotClient.getActorEmail(contactId)
    : await hubSpotClient.getActorPhoneNumber(contactId)

  if (!contactIdentifier) {
    logger.forBot().error(`No ${isEmail ? 'email' : 'phone number'} found for contact:`, contactId)
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: threadInfo.id,
    },
  })

  const { user } = await client.getOrCreateUser({
    tags: {
      id: contactIdentifier,
      ...(isEmail ? { email: contactIdentifier } : { phone: contactIdentifier })
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
