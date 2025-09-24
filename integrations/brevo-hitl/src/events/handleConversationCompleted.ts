import * as bp from '.botpress'
import { BrevoApi } from 'src/client'
import { brevoConversationTranscriptEventSchema } from 'src/definitions/brevo-schemas'
import { z } from 'zod'

type BrevoConversationTranscriptEvent = z.infer<typeof brevoConversationTranscriptEventSchema>

export const handleConversationCompleted = async ({
  brevoEvent,
  client,
}: {
  brevoEvent: BrevoConversationTranscriptEvent
  client: bp.Client
}) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: brevoEvent.visitor.id,
    },
  })

  await client.createEvent({
    type: 'hitlStopped',
    payload: {
      conversationId: conversation.id,
    },
  })
}
