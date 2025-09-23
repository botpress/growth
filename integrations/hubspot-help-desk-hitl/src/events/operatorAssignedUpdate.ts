import { OperatorAssignedUpdateParams, ThreadInfo } from '../misc/types'

export const handleOperatorAssignedUpdate = async ({
  hubspotEvent,
  client,
  hubSpotClient,
  logger,
}: OperatorAssignedUpdateParams) => {
  const threadInfo: ThreadInfo = await hubSpotClient.getThreadInfo(hubspotEvent.objectId)

  // Get the contact ID and determine if we need email or phone
  const contactId = threadInfo.associatedContactId

  // Get both email and phone number
  const email = await hubSpotClient.getActorEmail('V-' + contactId)
  const phoneNumber = await hubSpotClient.getActorPhoneNumber(contactId)

  if (!email && !phoneNumber) {
    logger.forBot().error(`No email or phone number found for contact:`, contactId)
    return
  }

  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: threadInfo.id,
    },
  })

  // Try to find existing user by email first, then by phone number
  let user
  let emailUserToDelete = null
  let phoneUserToDelete = null

  if (email) {
    logger.forBot().info(`Trying to find/create user with email: ${email}`)
    const { user: emailUser } = await client.getOrCreateUser({
      tags: { email },
    })

    // Check if this is an existing user (contactType already set) or newly created
    if (emailUser.tags?.contactType) {
      logger.forBot().info(`Found existing user with email (contactType: ${emailUser.tags.contactType})`)
      user = emailUser
    } else {
      logger.forBot().info(`Created new user with email, trying phone number next`)
      // This is a newly created user, try phone number next
      emailUserToDelete = emailUser

      if (phoneNumber) {
        logger.forBot().info(`Trying to find/create user with phone number: ${phoneNumber}`)
        const { user: phoneUser } = await client.getOrCreateUser({
          tags: { phoneNumber },
        })
        if (phoneUser.tags?.contactType) {
          logger.forBot().info(`Found existing user with phone number (contactType: ${phoneUser.tags.contactType})`)
          user = phoneUser
        } else {
          logger.forBot().info(`Created new user with phone number - no existing users found`)
          phoneUserToDelete = phoneUser
        }
      }
    }
  } else if (phoneNumber) {
    logger.forBot().info(`No email available, trying phone number: ${phoneNumber}`)
    const { user: phoneUser } = await client.getOrCreateUser({
      tags: { phoneNumber },
    })
    if (phoneUser.tags?.contactType) {
      logger.forBot().info(`Found existing user with phone number (contactType: ${phoneUser.tags.contactType})`)
      user = phoneUser
    } else {
      logger.forBot().info(`Created new user with phone number - no existing users found`)
      phoneUserToDelete = phoneUser
    }
  }

  // Delete unnecessary users
  if (emailUserToDelete) {
    try {
      await client.deleteUser({ id: emailUserToDelete.id })
      logger.forBot().info(`Deleted unnecessary email user: ${emailUserToDelete.id}`)
    } catch (error) {
      logger.forBot().warn(`Failed to delete unnecessary email user: ${emailUserToDelete.id}`, error)
    }
  }

  if (phoneUserToDelete) {
    try {
      await client.deleteUser({ id: phoneUserToDelete.id })
      logger.forBot().info(`Deleted unnecessary phone user: ${phoneUserToDelete.id}`)
    } catch (error) {
      logger.forBot().warn(`Failed to delete unnecessary phone user: ${phoneUserToDelete.id}`, error)
    }
  }

  if (!user) {
    logger
      .forBot()
      .error(
        `No existing user found for contact: ${contactId}. Both email and phone number users were newly created and deleted.`
      )
    return
  }

  await client.createEvent({
    type: 'hitlAssigned',
    payload: {
      conversationId: conversation.id,
      userId: user.id as string,
    },
  })
}
