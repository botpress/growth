import { RuntimeError } from '@botpress/client'
import axios, { Axios, AxiosError, isAxiosError } from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import { v4 as uuidv4, v4 } from 'uuid'
import {
  type SFMessagingConfig,
  type CreateTokenResponse,
  type LiveAgentSession,
  SFMessagingConfigSchema,
  CreateTTSessionResponse,
} from './definitions/schemas'
import { getFileExtensionFromUrl } from './utils'
import { secrets, Logger } from '.botpress'

class MessagingApi {
  private _session?: LiveAgentSession
  private _client: Axios
  private _apiBaseUrl: string

  public constructor(
    private _logger: Logger,
    private _config: SFMessagingConfig,
    _session?: LiveAgentSession,
  ) {
    this._apiBaseUrl = _config.endpoint + '/iamessage/api/v2'

    this._client = axios.create({
      baseURL: this._apiBaseUrl,
    })

    this._session = _session

    // Fill default values
    this._config = SFMessagingConfigSchema.parse(_config)

    this._client.interceptors.request.use((axiosConfig) => {
      // @ts-ignore
      axiosConfig.headers = {
        ...axiosConfig.headers,
        ...this._getMessagingConfig().headers,
      }
      return axiosConfig
    })
  }

  public async createConversation(conversationId: string, attributes: any): Promise<void> {
    const createConversationData = {
      conversationId,
      routingAttributes: attributes,
      esDeveloperName: this._config.DeveloperName,
    }

    try {
      this._logger.forBot().debug('Creating conversation on Salesforce with data: ', {
        urlBase: this._client.defaults.baseURL,
        headers: {
          ...this._getMessagingConfig().headers,
        },
        createConversationData,
      })

      const { data } = await this._client.post('/conversation', createConversationData)

      return data
    } catch (thrown: unknown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      const axiosError = thrown as any
      this._logger.forBot().info('Tried to create conversation on Salesforce: ' + JSON.stringify({
        createConversationData,
      }, null, 2))
      const responseDataString = axiosError?.response?.data ? JSON.stringify(axiosError.response.data) : 'No response data'
      throw new RuntimeError('Failed to create conversation on Salesforce: ' + error.message + ' | Response: ' + responseDataString + ' | Request Body: ' + JSON.stringify(createConversationData))
    }
  }

  public async createTokenForUnauthenticatedUser(): Promise<CreateTokenResponse> {
    const createTokenData = {
      orgId: this._config.organizationId,
      esDeveloperName: this._config.DeveloperName,
      capabilitiesVersion: '1',
      platform: 'Web',
      context: {
        appName: 'botpressHITL',
        clientVersion: '1.2.3',
      },
    }

    try {
      const { data } = await this._client.post<CreateTokenResponse>('/authorization/unauthenticated/access-token', createTokenData)

      this._session = { ...this._session, accessToken: data.accessToken }
      return data
    } catch (thrown: unknown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      const axiosError = thrown as any
      this._logger.forBot().info('Tried to create token for user on Salesforce: ' + JSON.stringify({
        createTokenData
      }, null, 2))
      const responseDataString = axiosError?.response?.data ? JSON.stringify(axiosError.response.data) : 'No response data'
      throw new RuntimeError('Failed to create token for user on Salesforce: ' + error.message + ' | Response: ' + responseDataString)
    }
  }

  public getCurrentSession() {
    return this._session
  }

  private _getMessagingConfig() {
    return {
      headers: {
        ...(this._session?.accessToken && {
          Authorization: 'Bearer ' + this._session?.accessToken,
        }),
        'X-Org-Id': this._config.organizationId,
      },
    }
  }

  // We use Transport Translator to translate from SSE -> Webhook
  public async startSSE(opts?: { webhook: { url: string } }): Promise<CreateTTSessionResponse | undefined> {
    try {
      if (!this._session) {
        throw new RuntimeError("Tried to start a sse Session but doesn't have a Messaging Session")
      }

      const { data } = await axios.post<CreateTTSessionResponse>(
        `${secrets.TT_URL}/api/v1/sse`,
        {
          sse: {
            headers: this._getMessagingConfig().headers,
            ignore: {
              onEvent: [
                'ping',
                'CONVERSATION_TYPING_STOPPED_INDICATOR',
                'CONVERSATION_TYPING_STARTED_INDICATOR',
                'CONVERSATION_READ_ACKNOWLEDGEMENT',
                'CONVERSATION_DELIVERY_ACKNOWLEDGEMENT',
                'CONVERSATION_END_USER_CONSENT_UPDATED',
                'CONVERSATION_ROUTING_RESULT',
              ],
            },
            end: {
              onRawMatch: ['force_end_tt_transport', 'Jwt is expired', '"status":401,"error":"Unauthorized","path":"/eventrouter/v1/sse"'],
            },
          },
          target: {
            debug: true,
            url: `${this._config.endpoint}/eventrouter/v1/sse`,
          },
          webhook: { url: opts?.webhook.url },
        },
        {
          headers: {
            secret: secrets.TT_SK,
          },
        },
      )

      this._session.sseKey = data.data.key
      return data
    } catch (thrown: unknown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      this._logger.forBot().error('Failed to start SSE Session with TT: ' + error.message)
      throw new RuntimeError('Failed to start SSE Session with TT: ' + error.message)
    }
  }

  public async stopSSE(transportKey: string) {
    try {
      await axios.delete(`${secrets.TT_URL}/api/v1/sse`, {
        headers: {
          secret: secrets.TT_SK,
          'transport-key': transportKey,
        },
      })
    } catch (thrown: unknown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      this._logger.forBot().error('Failed to stop SSE Session with TT: ' + error.message)
    }
  }

  public async sendMessage(message: string) {
    if (!this._session) {
      throw new RuntimeError('Tried to send message to a session that is not initialized yet')
    }

    const sendMessageData = {
      message: {
        id: v4(),
        messageType: 'StaticContentMessage',
        staticContent: {
          formatType: 'Text',
          text: message,
        },
      },
      esDeveloperName: this._config.DeveloperName,
      isNewMessagingSession: false,
    }

    try {
      await this._client.post(`/conversation/${this._session.conversationId}/message`, sendMessageData)
    } catch (thrown: unknown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      const axiosError = thrown as any
      this._logger.forBot().info('Tried to send message to Salesforce: ' + JSON.stringify({
        sendMessageData
      }, null, 2))
      const responseDataString = axiosError?.response?.data ? JSON.stringify(axiosError.response.data) : 'No response data'
      throw new RuntimeError('Failed to send message: ' + error.message + ' | Response: ' + responseDataString)
    }
  }

  // https://developer.salesforce.com/docs/service/messaging-api/references/miaw-api-reference?meta=sendFile
  public async sendFile({ fileUrl, title, message }: { fileUrl: string; title?: string; message?: string }) {
    if (!this._session) {
      throw new RuntimeError('Tried to send file to a session that is not initialized yet')
    }

    const tempFilePath = `/tmp/${uuidv4()}.png`
    const extension = getFileExtensionFromUrl(fileUrl)
    const generatedFileId = v4()

    try {
      const response = await axios.get(fileUrl, { responseType: 'stream' })

      const writer = fs.createWriteStream(tempFilePath)
      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      const formData = new FormData()
      const messageEntry = {
        esDeveloperName: this._config.DeveloperName,
        message: {
          id: v4(),
          fileId: generatedFileId,
          text: (message?.length && message) || '',
        },
      }

      formData.append('messageEntry', JSON.stringify(messageEntry), {
        contentType: 'application/json',
      })

      formData.append('fileData', fs.createReadStream(tempFilePath), {
        filename: `${(title?.length && title) || `${generatedFileId}.${extension}`}`,
        contentType: 'application/octet-stream',
      })

      await this._client.post(`/conversation/${this._session.conversationId}/file`, formData, {
        headers: formData.getHeaders(),
      })
    } catch (thrown: unknown) {
      let errorMessage = `Failed to send file '${(title?.length && title) || `.${extension}`}' to agent, will use file url message fallback`
      if (isAxiosError(thrown)) {
        const axiosError = thrown as AxiosError
        const docsLink =
          'https://developer.salesforce.com/docs/service/messaging-api/references/miaw-api-reference?meta=sendFile'

        if (axiosError.response?.status === 413) {
          errorMessage += `\n-> File too large, maximum size of each file is 5 MB, please check the Salesforce documentation for more details \n-> "${docsLink}"`
        }

        if (axiosError.response?.status === 415) {
          errorMessage += `\n-> Unsupported content file type, please check the Salesforce documentation for more details \n-> "${docsLink}"`
        }

        const axiosMessage = ((thrown as AxiosError).response?.data as any)?.message
        if (axiosMessage?.length) {
          errorMessage += `\n-> Salesforce message "${axiosMessage}"`
        }
      }
      errorMessage += `\n-> ${thrown instanceof Error ? thrown : new Error(String(thrown))}`
      this._logger.forBot().warn(errorMessage)
      await this.sendMessage(fileUrl)
    }
  }

  public async closeConversation() {
    if (!this._session) {
      throw new RuntimeError('Tried to end a conversation that is not initialized yet')
    }

    await this._client.delete(
      `/conversation/${this._session.conversationId}?esDeveloperName=${this._config.DeveloperName}`,
    )
  }

  /**
   * Retrieves the routing status of the current conversation from Salesforce MIAW API
   * This is used to determine if an agent removal is due to a transfer or actual chat ending
   *
   * Routing status values:
   * - TRANSFER: Agent was transferred (don't close conversation)
   * - INITIAL: Conversation back to initial status (don't close conversation)
   * - NEEDS_ROUTING: Agent ended the chat (close conversation)
   *
   * @returns Promise resolving to conversation routing status
   * @throws RuntimeError if the API call fails or session is not initialized
   */
  public async getConversationRoutingStatus(): Promise<{ conversationId: string; routingStatus: string }> {
    if (!this._session?.conversationId) {
      throw new RuntimeError('Tried to get routing status for a session that is not initialized yet')
    }

    try {
      this._logger.forBot().debug('Getting conversation routing status', {
        conversationId: this._session.conversationId,
        url: `${this._apiBaseUrl}/conversation/${this._session.conversationId}`,
        hasAccessToken: !!this._session?.accessToken,
      })

      const { data } = await this._client.get(`/conversation/${this._session.conversationId}`, {
        headers: {
          'content-type': 'application/json',
          ...(this._session?.accessToken && {
            Authorization: `Bearer ${this._session.accessToken}`,
          }),
        },
      })

      this._logger.forBot().debug('Received routing status response', {
        conversationId: this._session.conversationId,
        routingStatus: data.routingStatus,
        fullResponse: data,
      })

      return {
        conversationId: this._session.conversationId,
        routingStatus: data.routingStatus,
      }
    } catch (thrown: unknown) {
      const error = thrown instanceof Error ? thrown : new Error(String(thrown))
      this._logger.forBot().error('Failed to get conversation routing status: ' + error.message, {
        conversationId: this._session.conversationId,
        error: thrown,
      })
      throw new RuntimeError('Failed to get conversation routing status: ' + error.message)
    }
  }
}

export const getSalesforceClient = (logger: Logger, config: SFMessagingConfig, session: LiveAgentSession = {}) =>
  new MessagingApi(logger, config, session)

export const getSalesforceClientWithBotpress = async (
  props: { client: any; ctx: any; conversation: any; logger: any }
) => {
  const { client, ctx, conversation, logger } = props
  const {
    state: {
      payload: { accessToken, developerName },
    },
  } = await client.getState({
    type: 'conversation',
    id: conversation.id,
    name: 'messaging',
  })

  return getSalesforceClient(
    logger,
    { 
      ...(ctx.configuration as SFMessagingConfig),
      DeveloperName: (developerName && developerName.trim() !== '') 
        ? developerName 
        : (ctx.configuration as SFMessagingConfig).DeveloperName
    },
    {
      accessToken,
      sseKey: conversation.tags.transportKey,
      conversationId: conversation.tags.id,
    },
  )
}
