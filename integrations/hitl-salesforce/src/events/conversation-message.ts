import { MessageMessagingTrigger, MessageDataPayload, RichLinkStaticContent } from '../triggers'
import * as bp from '.botpress'

export const executeOnConversationMessage = async ({
  messagingTrigger,
  conversation,
  client,
  logger,
  ctx,
}: bp.HandlerProps & {
  messagingTrigger: MessageMessagingTrigger
  conversation: bp.AnyMessageProps['conversation']
}) => {
  const {
    sender: { role: senderRole, subject: senderSubject },
    senderDisplayName,
  } = messagingTrigger.data.conversationEntry

  let entryPayload: MessageDataPayload

  try {
    entryPayload = JSON.parse(messagingTrigger.data.conversationEntry.entryPayload) as MessageDataPayload
  } catch (e) {
    logger.forBot().error('Could not parse entry payload', e)
    return
  }

  const { user } = await client.getOrCreateUser({
    name: senderDisplayName,
    tags: {
      id: senderSubject,
    },
  })

  // Only process Agent or System messages
  if (senderRole === 'EndUser') {
    return
  }

  if (!user.name?.length) {
    void client.updateUser({
      ...user,
      name: senderDisplayName,
      tags: {
        id: senderSubject,
      },
    })
  }

  if (entryPayload.abstractMessage.messageType !== 'StaticContentMessage') {
    logger
      .forBot()
      .warn(`Salesforce Messaging HITL does not support messages of type '${entryPayload.abstractMessage.messageType}'`)
    return
  }

  const createMessage = async (args: { type: 'text' | 'image' | 'file'; payload: any }) => {
    return client.createMessage({
      ...args,
      tags: {},
      userId: user?.id as string,
      conversationId: conversation.id,
    })
  }

  switch (entryPayload.abstractMessage.staticContent.formatType) {
    case 'Text':
      await createMessage({
        type: 'text',
        payload: {
          text: `${(ctx.configuration.showAgentName && senderRole === 'Agent' && `${senderDisplayName}: `) || ''}${
            entryPayload.abstractMessage.staticContent.text
          }`,
        },
      })
      break
    case 'Attachments':
      for (const attachment of entryPayload.abstractMessage.staticContent.attachments) {
        if (attachment.mimeType.startsWith('image/')) {
          await createMessage({
            type: 'image',
            payload: {
              imageUrl: attachment.url,
            },
          })
        } else {
          await createMessage({
            type: 'file',
            payload: {
              fileUrl: attachment.url,
            },
          })
        }
      }
      break
    case 'RichLink':
      const richLinkContent = entryPayload.abstractMessage.staticContent as RichLinkStaticContent
      // Send just the link item as text content
      const linkText = `${richLinkContent.linkItem.titleItem.title}: ${richLinkContent.linkItem.url}`
      await createMessage({
        type: 'text',
        payload: {
          text: `${(ctx.configuration.showAgentName && senderRole === 'Agent' && `${senderDisplayName}: `) || ''}${linkText}`,
        },
      })
      break
    default:
      logger
        .forBot()
        .warn(
          `Salesforce Messaging HITL does not support messages of format type '${entryPayload.abstractMessage.staticContent.formatType}'`,
        )
      return
  }
}
