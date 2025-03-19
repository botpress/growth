import { RuntimeError } from '@botpress/client'
import axios, { Axios } from 'axios'
import { v4 } from 'uuid'
import {
  type SFMessagingConfig,
  type CreateTokenResponse,
  type LiveAgentSession,
  SFMessagingConfigSchema,
  CreateTTSessionResponse,
} from './definitions/schemas'
import { secrets, Logger } from '.botpress'

class MessagingApi {
  private _session?: LiveAgentSession
  private _client: Axios
  private _apiBaseUrl: string

  public constructor(private _logger: Logger, private _config: SFMessagingConfig, _session?: LiveAgentSession) {
    this._apiBaseUrl = _config.endpoint + '/iamessage/api/v2'

    this._client = axios.create({
      baseURL: this._apiBaseUrl,
    })

    this._session = _session

    // Fill default values
    this._config = SFMessagingConfigSchema.parse(_config)

    this._client.interceptors.request.use((axionsConfig) => {
      // @ts-ignore
      axionsConfig.headers = {
        ...axionsConfig.headers,
        ...this._getMessagingConfig().headers,
      }
      return axionsConfig
    })
  }

  public async createConversation(conversationId: string, attributes: any): Promise<void> {
    try {
      const createConversationData = {
        conversationId,
        routingAttributes: attributes,
        esDeveloperName: this._config.DeveloperName,
      }

      this._logger.forBot().debug('Creating conversation on Salesforce with data: ', {
        urlBase: this._client.defaults.baseURL,
        headers: {
          ...this._getMessagingConfig().headers,
        },
        createConversationData,
      })

      const { data } = await this._client.post('/conversation', createConversationData)

      return data
    } catch (e: any) {
      this._logger.forBot().error('Failed to create conversation on Salesforce: ' + e.message)
      throw new RuntimeError('Failed to create conversation on Salesforce: ' + e.message)
    }
  }

  public async createTokenForUnauthenticatedUser(): Promise<CreateTokenResponse> {
    try {
      const { data } = await this._client.post<CreateTokenResponse>('/authorization/unauthenticated/access-token', {
        orgId: this._config.organizationId,
        esDeveloperName: this._config.DeveloperName,
        capabilitiesVersion: '1',
        platform: 'Web',
        context: {
          appName: 'botpressHITL',
          clientVersion: '1.2.3',
        },
      })

      this._session = { ...this._session, accessToken: data.accessToken }
      return data
    } catch (thrown) {
      const err = thrown instanceof Error ? thrown : new Error(String(thrown))
      this._logger.forBot().error('Failed to create conversation on Salesforce: ' + err.message)
      throw new RuntimeError('Failed to create conversation on Salesforce: ' + err.message)
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
              onRawMatch: ['force_end_tt_transport', 'Jwt is expired'],
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
        }
      )

      this._session.sseKey = data.data.key
      return data
    } catch (thrown) {
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
    } catch (e: any) {
      this._logger.forBot().error('Failed to stop SSE Session with TT: ' + e.message)
    }
  }

  public async sendMessage(message: string) {
    if (!this._session) {
      throw new RuntimeError('Tried to send message to a session that is not initilized yet')
    }

    await this._client.post(`/conversation/${this._session.conversationId}/message`, {
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
    })
  }

  public async closeConversation() {
    if (!this._session) {
      throw new RuntimeError('Tried to end a conversation that is not initialized yet')
    }

    await this._client.delete(
      `/conversation/${this._session.conversationId}?esDeveloperName=${this._config.DeveloperName}`
    )
  }
}

export const getSalesforceClient = (logger: Logger, config: SFMessagingConfig, session: LiveAgentSession = {}) =>
  new MessagingApi(logger, config, session)
