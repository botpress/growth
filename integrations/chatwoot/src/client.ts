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

export const getProfile = async (ctx: bp.Context): Promise<ChatwootProfile> => {
  const apiAccessToken = getApiAccessToken(ctx)
  const response = await axios.get(`${BASE_URL}/profile`, {
    headers: { api_access_token: apiAccessToken },
  })
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to get profile: ${response.data.description}`)
  }
  return response.data as ChatwootProfile
}

export const sendMessage = async (
  ctx: bp.Context,
  accountId: string,
  conversationId: string,
  content: string
): Promise<ChatwootMessageResponse['id']> => {
  const apiAccessToken = getApiAccessToken(ctx)
  const response = await axios.post(
    `${BASE_URL}/accounts/${accountId}/conversations/${conversationId}/messages`,
    { content, message_type: 'incoming', private: false },
    { headers: { api_access_token: apiAccessToken } }
  )
  if (response.status !== 200) {
    throw new RuntimeError(`Failed to send message: ${response.data.description}`)
  }
  return response.data as ChatwootMessageResponse['id']
}

export const sendAttachment = async (
  ctx: bp.Context,
  accountId: string,
  conversationId: string,
  fileBuffer: Buffer,
  fileName: string
): Promise<ChatwootMessageResponse['id']> => {
  const apiAccessToken = getApiAccessToken(ctx)
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
  return response.data as ChatwootMessageResponse['id']
}

export const searchContactByEmail = async (
  ctx: bp.Context,
  accountId: string,
  email: string
): Promise<ChatwootContactSearchResponse> => {
  const apiAccessToken = getApiAccessToken(ctx)
  const response = await axios.get(`${BASE_URL}/accounts/${accountId}/contacts/search`, {
    params: { q: email },
    headers: { api_access_token: apiAccessToken },
  })
  return response.data as ChatwootContactSearchResponse
}

export const createContact = async (
  ctx: bp.Context,
  accountId: string,
  email: string,
  name: string
): Promise<ChatwootContactCreateResponse> => {
  const apiAccessToken = getApiAccessToken(ctx)
  const response = await axios.post(
    `${BASE_URL}/accounts/${accountId}/contacts`,
    { email, name, inbox_id: ctx.configuration.inboxId },
    { headers: { api_access_token: apiAccessToken } }
  )
  return response.data as ChatwootContactCreateResponse
}

export const createConversation = async (
  ctx: bp.Context,
  accountId: string,
  contactId: string,
  message?: string
): Promise<ChatwootConversationResponse> => {
  const apiAccessToken = getApiAccessToken(ctx)
  const response = await axios.post(
    `${BASE_URL}/accounts/${accountId}/conversations`,
    {
      contact_id: contactId,
      inbox_id: ctx.configuration.inboxId,
      message: message ? { content: message } : undefined,
    },
    { headers: { api_access_token: apiAccessToken } }
  )
  return response.data as ChatwootConversationResponse
}

export const resolveConversation = async (
  ctx: bp.Context,
  accountId: string,
  conversationId: string
): Promise<ChatwootStatusToggleResponse> => {
  const apiAccessToken = getApiAccessToken(ctx)
  const response = await axios.post(
    `${BASE_URL}/accounts/${accountId}/conversations/${conversationId}/toggle_status`,
    { status: 'resolved' },
    { headers: { api_access_token: apiAccessToken } }
  )
  return response.data as ChatwootStatusToggleResponse
}
