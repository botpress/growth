export type ChatwootEventType =
  | 'message_created'
  | 'message_updated'
  | 'conversation_created'
  | 'conversation_updated'
  | 'conversation_status_changed'
  | 'webwidget_triggered'

export type ChatwootSender = {
  id: number
  name?: string
  email?: string
  phone_number?: string
  type: string
  avatar_url?: string
}

export type ChatwootAgent = {
  id: number
  account_id: number
  email: string
  name: string
  role: string
  availability_status?: string
  avatar_url?: string
  confirmed?: boolean
}

export type ChatwootConversation = {
  id: number
  account_id?: number
  inbox_id: number
  status: string
  channel?: string
  unread_count?: number
  can_reply?: boolean
  muted?: boolean
  created_at?: number
  last_activity_at?: number
  meta?: {
    assignee?: {
      id: number
      name: string
      email?: string
      avatar_url?: string
    }
    sender?: {
      id: number
      name: string
      email?: string
    }
  }
}

export type ChatwootContactConversationsResponse = {
  payload: ChatwootConversation[]
}

export type ChatwootAttachment = {
  id: number
  message_id: number
  file_type: string
  data_url: string
  thumb_url?: string
}

export type ChatwootWebhookPayload = {
  event: ChatwootEventType
  id?: number
  status?: string
  content?: string
  created_at?: string
  private?: boolean
  message_type?: string
  sender?: ChatwootSender
  conversation?: ChatwootConversation
  attachments?: ChatwootAttachment[]
}

export type ChatwootProfile = {
  id: number
  name: string
  email: string
  accounts: Array<{
    id: number
    name: string
    role: string
  }>
}

export type ChatwootMessageResponse = {
  id: number
  content: string
  message_type: number
  conversation_id: number
  created_at: number
}

export type ChatwootContact = {
  id: number
  name: string
  email: string
  phone_number?: string
  avatar_url?: string
  created_at: string
}

export type ChatwootContactSearchResponse = {
  payload: ChatwootContact[]
}

export type ChatwootContactCreateResponse = {
  payload: {
    contact: ChatwootContact
  }
}

export type ChatwootConversationResponse = {
  id: number
  inbox_id: number
  status: string
  contact_last_seen_at?: string
  created_at: number
}

export type ChatwootStatusToggleResponse = {
  success: boolean
  current_status: string
  conversation_id: number
}
