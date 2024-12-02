export type TriggerPayload = {
  type: string
  transport: {
    key: string
  }
  payload:
    | RoutingResultMessagingTrigger
    | MessageMessagingTrigger
    | CloseConversationMessagingTrigger
    | ParticipantChangedMessagingTrigger
    | UndefinedMessagingTrigger
    | OtherMessagingTrigger
}

// https://developer.salesforce.com/docs/service/messaging-api/references/about/server-sent-events-structure.html

export type RawMessagingTrigger = {
  raw: String
}

export type UndefinedMessagingTrigger = {
  event: undefined
  data: any
} & RawMessagingTrigger

export type OtherMessagingTrigger = {
  event: string
  data: any
} & RawMessagingTrigger

export type RoutingResultMessagingTrigger = {
  event: 'CONVERSATION_ROUTING_RESULT'
  data: EventData
} & RawMessagingTrigger

export type MessageMessagingTrigger = {
  event: 'CONVERSATION_MESSAGE'
  data: EventData
} & RawMessagingTrigger

export type ParticipantChangedMessagingTrigger = {
  event: 'CONVERSATION_PARTICIPANT_CHANGED'
  data: EventData
} & RawMessagingTrigger

export type CloseConversationMessagingTrigger = {
  event: 'CONVERSATION_CLOSE_CONVERSATION'
  data: EventData
} & RawMessagingTrigger

type EventData = {
  channelPlatformKey: string
  channelType: 'embedded_messaging'
  channelAddressIdentifier: string
  conversationId: string
  conversationEntry: {
    senderDisplayName: string
    identifier: string
    entryType: string
    entryPayload: string
    sender: {
      role: 'Agent' | 'System' | 'EndUser' | string
      appType: 'agent' | 'conversation' | 'iamessage' | string
      subject: string
      clientIdentifier: string
    }
    contextParamMap: Record<string, unknown>
    visibilityStrategy: string
    transcriptedTimestamp: number
    relatedRecords: string[]
    clientTimestamp: number
    clientDuration: number
  }
}

// These payloads will be on string format initially

export type RoutingResultPayload = {
  entryType: 'RoutingResult'
  id: string
  recordId: string
  errorMessages: string[]
  pendingServiceRoutingId: string
  routingType: string
  estimatedWaitTime: {
    estimatedWaitTimeInSeconds: number
    isEWTRequested: boolean
  }
  failureReason: string
  failureType: string
  routingConfigurationDetails: {
    routingConfigurationType: string
    queueId: string
  }
}

export type MessageDataPayload = {
  entryType: 'Message'
  id: string
  abstractMessage: {
    messageType: 'StaticContentMessage'
    inReplyToMessageId: string | null
    id: string
    references: string[]
    staticContent: {
      formatType: 'Text'
      text: string
    }
  }
  messageReason: string | null
}

/*export type CloseConversationDataPayload = {
  entryType: "CloseConversation";
  id: string;
  conversationIdentifier: string;
};*/

export type ParticipantChangedDataPayload = {
  entryType: 'ParticipantChanged'
  id: string
  entries: {
    operation: 'add' | 'remove' | string
    menuMetadata: null | Record<string, unknown>
    participant: {
      role: 'Agent' | string
      appType: 'agent' | string
      subject: string
      clientIdentifier: string
    }
    displayName: string
  }[]
}
