export type ChatwootEventType =
  | 'message_created'
  | 'message_updated'
  | 'conversation_created'
  | 'conversation_updated'
  | 'conversation_status_changed'
  | 'webwidget_triggered'

export type ChatwootMessageType = 'incoming' | 'outgoing'

export interface ChatwootSender {
  id: number
  name?: string
  email?: string
  phone_number?: string
  type: 'contact' | 'user'
  avatar_url?: string
}

export interface ChatwootConversation {
  id: number
  inbox_id: number
  status: string
  channel?: string
}

export interface ChatwootInbox {
  id: number
  name: string
}

export interface ChatwootAccount {
  id: number
  name: string
}

export interface ChatwootAttachment {
  id: number
  message_id: number
  file_type: 'image' | 'video' | 'file'
  data_url: string
  thumb_url?: string
}

export interface ChatwootWebhookPayload {
  event: ChatwootEventType
  id?: number
  content?: string
  created_at?: string
  message_type?: ChatwootMessageType
  private?: boolean
  sender?: ChatwootSender
  conversation?: ChatwootConversation
  inbox?: ChatwootInbox
  account?: ChatwootAccount
  attachments?: ChatwootAttachment[]
}

export interface ChatwootProfile {
  id: number
  name: string
  email: string
  accounts: Array<{
    id: number
    name: string
    role: string
  }>
}

export interface ChatwootMessageResponse {
  id: number
  content: string
  message_type: number
  conversation_id: number
  created_at: number
}

export interface ChatwootContact {
  id: number
  name: string
  email: string
  phone_number?: string
  avatar_url?: string
  created_at: string
}

export interface ChatwootContactSearchResponse {
  payload: ChatwootContact[]
}

export interface ChatwootContactCreateResponse {
  payload: {
    contact: ChatwootContact
  }
}

export interface ChatwootConversationResponse {
  id: number
  inbox_id: number
  status: string
  contact_last_seen_at?: string
  created_at: number
}

export interface ChatwootStatusToggleResponse {
  success: boolean
  current_status: string
  conversation_id: number
}
