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
  type: 'contact' | 'user' // contact = end user, user = agent
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
  file_type: 'image' | 'audio' | 'video' | 'file'
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
