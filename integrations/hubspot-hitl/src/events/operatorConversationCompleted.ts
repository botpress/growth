import * as bp from ".botpress";

export const handleConversationCompleted = async ({
  hubspotEvent,
  client,
}: {
  hubspotEvent: any;
  client: bp.Client;
}) => {
  const { conversation } = await client.getOrCreateConversation({
    channel: "hitl",
    tags: {
      id: hubspotEvent.objectId.toString(),
    },
  });

  await client.createEvent({
    type: "hitlStopped",
    payload: {
      conversationId: conversation.id,
    },
  });
};
