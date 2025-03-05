export type ConversationWebhookPayload = {
  entity_type: "conversation";
  webhook: {
    id: string;
  };
  org_id: string;
  event: "conversation.operator.replied";
  entity_id: string;
  attempt: number;
  version: string;
  app_id: string;
  entity: {
    id: string;
    visitor_conversation_id: string;
    message: {
      sender: {
        name: string;
        id: string;
        type: "operator";
      };
      meta: Record<string, unknown>; // Empty object, but allows for extensibility
      msgid: string;
      text: string;
    };
    visitor: {
      name: string;
      channel: "website"; // Assuming this is always "website"
      id: string;
      type: "lead";
      email_id: string;
    };
  };
  event_time: string;
};
  