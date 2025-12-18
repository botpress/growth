import * as bp from '.botpress'
import axios from 'axios'
import { RuntimeError } from '@botpress/sdk'
import {
  ChatwootMessageResponse,
  ChatwootProfile,
  ChatwootContactSearchResponse,
  ChatwootContactCreateResponse,
  ChatwootConversationResponse,
  ChatwootStatusToggleResponse,
  ChatwootConversation,
  ChatwootAgent,
  chatwootProfileSchema,
  chatwootMessageResponseSchema,
  chatwootContactSearchResponseSchema,
  chatwootContactCreateResponseSchema,
  chatwootConversationResponseSchema,
  chatwootStatusToggleResponseSchema,
  chatwootAgentSchema,
  chatwootConversationSchema,
} from './misc/types'
import FormData from 'form-data'

const BASE_URL = 'https://app.chatwoot.com/api/v1'

export const getApiAccessToken = (ctx: bp.Context) => {
  const apiAccessToken = ctx.configuration.apiAccessToken
  if (!apiAccessToken) {
    throw new RuntimeError('API access token is required')
  }
  return apiAccessToken
}

export const getProfile = async (apiAccessToken: string): Promise<ChatwootProfile> => {
  const response = await axios.get(`${BASE_URL}/profile`, {
    headers: { api_access_token: apiAccessToken },
  })
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to get profile: ${response.data.description}`)
  }
  return chatwootProfileSchema.parse(response.data)
}

export const sendMessage = async (
  apiAccessToken: string,
  accountId: string,
  conversationId: string,
  content: string,
  messageType: 'incoming' | 'outgoing'
): Promise<ChatwootMessageResponse['id']> => {
  const response = await axios.post(
    `${BASE_URL}/accounts/${accountId}/conversations/${conversationId}/messages`,
    { content, message_type: messageType, private: false },
    { headers: { api_access_token: apiAccessToken } }
  )
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to send message: ${response.data.description}`)
  }
  return chatwootMessageResponseSchema.parse(response.data).id
}

export const sendAttachment = async (
  apiAccessToken: string,
  accountId: string,
  conversationId: string,
  fileBuffer: Buffer,
  fileName: string
): Promise<ChatwootMessageResponse['id']> => {
  const formData = new FormData()
  formData.append('attachments[]', fileBuffer, fileName)
  const response = await axios.post(
    `${BASE_URL}/accounts/${accountId}/conversations/${conversationId}/messages`,
    formData,
    { headers: { api_access_token: apiAccessToken, ...formData.getHeaders() } }
  )
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to send attachment: ${response.data.description}`)
  }
  return chatwootMessageResponseSchema.parse(response.data).id
}

export const searchContactByEmail = async (
  apiAccessToken: string,
  accountId: string,
  email: string
): Promise<ChatwootContactSearchResponse> => {
  const response = await axios.get(`${BASE_URL}/accounts/${accountId}/contacts/search`, {
    params: { q: email },
    headers: { api_access_token: apiAccessToken },
  })
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to search contact by email: ${response.data.description}`)
  }
  return chatwootContactSearchResponseSchema.parse(response.data)
}

export const createContact = async (
  apiAccessToken: string,
  accountId: string,
  email: string,
  inboxId: string
): Promise<ChatwootContactCreateResponse> => {
  const response = await axios.post(
    `${BASE_URL}/accounts/${accountId}/contacts`,
    { email: email, name: email, inbox_id: inboxId },
    { headers: { api_access_token: apiAccessToken } }
  )
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to create contact: ${response.data.description}`)
  }
  return chatwootContactCreateResponseSchema.parse(response.data)
}

export const createConversation = async (
  apiAccessToken: string,
  accountId: string,
  contactId: string,
  inboxId: string
): Promise<ChatwootConversationResponse> => {
  const response = await axios.post(
    `${BASE_URL}/accounts/${accountId}/conversations`,
    {
      contact_id: contactId,
      inbox_id: inboxId,
    },
    { headers: { api_access_token: apiAccessToken } }
  )
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to create conversation: ${response.data.description}`)
  }
  return chatwootConversationResponseSchema.parse(response.data)
}

export const resolveConversation = async (
  apiAccessToken: string,
  accountId: string,
  conversationId: string
): Promise<ChatwootStatusToggleResponse> => {
  const response = await axios.post(
    `${BASE_URL}/accounts/${accountId}/conversations/${conversationId}/toggle_status`,
    { status: 'resolved' },
    { headers: { api_access_token: apiAccessToken } }
  )
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to resolve conversation: ${response.data.description}`)
  }
  return chatwootStatusToggleResponseSchema.parse(response.data)
}

export const getContactConversations = async (
  apiAccessToken: string,
  accountId: string,
  contactId: string
): Promise<ChatwootConversation[]> => {
  const response = await axios.get(`${BASE_URL}/accounts/${accountId}/contacts/${contactId}/conversations`, {
    headers: { api_access_token: apiAccessToken },
  })
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to get contact conversations: ${response.data.description}`)
  }
  return chatwootConversationSchema.array().parse(response.data.payload ?? [])
}

export const assignConversation = async (
  apiAccessToken: string,
  accountId: string,
  conversationId: string,
  assigneeId: string
): Promise<ChatwootAgent> => {
  const response = await axios.post(
    `${BASE_URL}/accounts/${accountId}/conversations/${conversationId}/assignments`,
    { assignee_id: assigneeId },
    { headers: { api_access_token: apiAccessToken } }
  )
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to assign conversation: ${response.data.description}`)
  }
  return chatwootAgentSchema.parse(response.data)
}

export const getPreviousAgentId = async (
  apiAccessToken: string,
  accountId: string,
  contactId: string
): Promise<number | null> => {
  const conversations = await getContactConversations(apiAccessToken, accountId, contactId)

  const withAssignee = conversations.filter((c) => c.meta?.assignee?.id).sort((a, b) => b.id - a.id)

  return withAssignee[0]?.meta?.assignee?.id || null
}

export const getActiveConversation = async (
  apiAccessToken: string,
  accountId: string,
  contactId: string
): Promise<ChatwootConversation | null> => {
  const conversations = await getContactConversations(apiAccessToken, accountId, contactId)
  return conversations.find((c) => c.status === 'open') || null
}
