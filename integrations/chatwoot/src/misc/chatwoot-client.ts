import * as bp from '.botpress'
import axios from 'axios'
import { RuntimeError } from '@botpress/sdk'
import { ChatwootMessageResponse, ChatwootProfile } from './types'

const BASE_URL = 'https://api.chatwoot.com/api/v1'

export const getApiAccessToken = (ctx: bp.Context) => {
  const apiAccessToken = ctx.configuration.apiAccessToken

  if (!apiAccessToken) {
    throw new RuntimeError('API access token is required')
  }

  return apiAccessToken
}

export const getProfile = async (ctx: bp.Context) => {
  const apiAccessToken = getApiAccessToken(ctx)

  const response = await axios.get(`${BASE_URL}/profile`, {
    headers: {
      'api-access-token': apiAccessToken,
    },
  })

  if (response.status !== 200) {
    throw new RuntimeError(`Failed to get profile: ${response.data.description}`)
  }

  return response.data as ChatwootProfile
}

export const sendMessage = async (ctx: bp.Context, accountId: string, conversationId: string, content: string) => {
  const apiAccessToken = getApiAccessToken(ctx)

  const response = await axios.post(`${BASE_URL}/accounts/${accountId}/conversations/${conversationId}/messages`, {
    headers: {
      'api-access-token': apiAccessToken,
    },
    body: {
      content: content,
      message_type: 'outgoing',
      private: false,
    },
  })

  if (response.status !== 200) {
    throw new RuntimeError(`Failed to send message: ${response.data.description}`)
  }

  return response.data as ChatwootMessageResponse['id']
}
