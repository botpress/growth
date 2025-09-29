import axios, { AxiosError } from 'axios'
import * as bp from '.botpress'

const LIVECHAT_API_ACTION_URL = 'https://api.livechatinc.com/v3.5/customer/action'

type ParamValue = string | number | boolean | object | undefined | null
type Params = Record<string, ParamValue>

interface CreateCustomerTokenPayload {
  grant_type: 'cookie'
  client_id: string
  organization_id: string
  redirect_uri?: string
}

interface StartAgentChatPayload {
  chat: {
    access: {
      group_ids: number[]
    }
    thread?: {
      events: {
        type: 'message'
        text: string
        visibility: 'all'
      }[]
    }
  }
}

interface LiveChatGroup {
  id: number
  name?: string
  agents: Array<{
    id: string
    name?: string
  }>
}

function validateRequiredParams(params: Params, methodName: string) {
  const missingParams = Object.entries(params)
    .filter(([_, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key)

  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters for ${methodName}: ${missingParams.join(', ')}`)
  }
}

export class LiveChatApi {
  private clientId: string
  private organizationId: string
  private logger: bp.Logger

  constructor(clientId: string, organizationId: string, logger: bp.Logger) {
    validateRequiredParams({ clientId, organizationId, logger }, 'LiveChatApi constructor')
    this.clientId = clientId
    this.organizationId = organizationId
    this.logger = logger
  }

  public async createCustomerToken(redirectUri?: string): Promise<{
    access_token: string
    entity_id: string
    expires_in: number
    token_type: string
    organization_id: string
  }> {
    const url = 'https://accounts.livechat.com/v2/customer/token'
    const payload: CreateCustomerTokenPayload = {
      grant_type: 'cookie',
      client_id: this.clientId,
      organization_id: this.organizationId,
    }
    if (redirectUri) payload.redirect_uri = redirectUri

    try {
      this.logger.forBot().info('Requesting new customer access token...')
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
      })
      return response.data
    } catch (error: any) {
      this.logger
        .forBot()
        .error('Error creating customer token:', JSON.stringify(error.response?.data) || error.message || String(error))
      throw error
    }
  }

  private async makeRequest(actionName: string, payload: object = {}, accessToken: string): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
    const url = `${LIVECHAT_API_ACTION_URL}/${actionName}?organization_id=${encodeURIComponent(this.organizationId)}`
    try {
      this.logger.forBot().info(`Making request to LiveChat action: ${actionName}`)
      const response = await axios.post(url, payload, { headers })
      return { success: true, data: response.data }
    } catch (error) {
      const err = error as AxiosError
      this.logger.forBot().error(`LiveChat API error for action '${actionName}':`, err.response?.data || err.message)
      return { success: false, message: err.response?.data || err.message }
    }
  }

  public async startChat(title: string, description: string, accessToken: string): Promise<any> {
    validateRequiredParams({ title, accessToken }, 'startChat')
    if (description === null || description === undefined) {
      throw new Error('Missing required parameter for startChat: description')
    }

    const payload = {
      chat: {
        thread: {
          events: [
            {
              type: 'message',
              text: `${title}\n\n${description}`,
              visibility: 'all',
            },
          ],
        },
      },
      continuous: true,
    }
    return this.makeRequest('start_chat', payload, accessToken)
  }

  public async sendMessage(chatId: string, message: string, accessToken: string): Promise<any> {
    validateRequiredParams({ chatId, message, accessToken }, 'sendMessage')

    const payload = {
      chat_id: chatId,
      event: { type: 'message', text: message, visibility: 'all' },
    }
    return this.makeRequest('send_event', payload, accessToken)
  }

  public async getChat(chatId: string, accessToken: string): Promise<any> {
    validateRequiredParams({ chatId, accessToken }, 'getChat')

    return this.makeRequest('get_chat', { chat_id: chatId }, accessToken)
  }

  public async listChats(accessToken: string): Promise<any> {
    validateRequiredParams({ accessToken }, 'listChats')

    return this.makeRequest('list_chats', {}, accessToken)
  }

  public async deactivateChat(chatId: string, accessToken: string): Promise<any> {
    validateRequiredParams({ chatId, accessToken }, 'deactivateChat')

    const payload = {
      id: chatId,
    }
    return this.makeRequest('deactivate_chat', payload, accessToken)
  }

  public async deactivateChatWithAgent(agentToken: string, chatId: string): Promise<any> {
    validateRequiredParams({ agentToken, chatId }, 'deactivateChatWithAgent')

    const url = 'https://api.livechatinc.com/v3.5/agent/action/close_chat'
    const payload = {
      chat_id: chatId,
    }

    try {
      this.logger.forBot().info(`Deactivating chat ${chatId} with agent token...`)
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Basic ${agentToken}`,
          'Content-Type': 'application/json',
        },
      })

      return { success: true, data: response.data }
    } catch (error: any) {
      const errorMessage = JSON.stringify(error.response?.data) || error.message || String(error)
      this.logger.forBot().error('Error deactivating chat with agent:', errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  public async getOrganizationId(licenseId: string, accessToken: string): Promise<any> {
    validateRequiredParams({ licenseId, accessToken }, 'getOrganizationId')

    const url = `https://api.livechatinc.com/v3.4/configuration/action/get_organization_id?license_id=${encodeURIComponent(licenseId)}`
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
    try {
      this.logger.forBot().info(`Requesting organization_id for license_id: ${licenseId}`)
      const response = await axios.get(url, { headers })
      return response.data
    } catch (error: any) {
      this.logger
        .forBot()
        .error(
          'Error fetching organization_id:',
          JSON.stringify(error.response?.data) || error.message || String(error)
        )
      throw error
    }
  }

  public async customerUpdate(
    accessToken: string,
    customerData: {
      email?: string
    }
  ): Promise<any> {
    validateRequiredParams({ accessToken, customerData }, 'customerUpdate')

    return this.makeRequest('update_customer', customerData, accessToken)
  }

  public async startAgentChat(agentToken: string, groupId: number, initialMessage?: string): Promise<any> {
    validateRequiredParams({ agentToken, groupId }, 'startAgentChat')

    const url = 'https://api.livechatinc.com/v3.5/agent/action/start_chat'
    const payload: StartAgentChatPayload = {
      chat: {
        access: {
          group_ids: [groupId],
        },
      },
    }

    if (initialMessage) {
      payload.chat.thread = {
        events: [
          {
            type: 'message',
            text: initialMessage,
            visibility: 'all',
          },
        ],
      }
    }

    try {
      this.logger.forBot().info(`Starting agent chat in group ${groupId}...`)
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Basic ${agentToken}`,
          'Content-Type': 'application/json',
        },
      })

      const chatId = response.data.chat_id || (response.data.chat && response.data.chat.id)
      this.logger.forBot().info(`Agent chat started with ID: ${chatId}`)

      return { success: true, data: response.data, chatId }
    } catch (error: any) {
      const errorMessage = JSON.stringify(error.response?.data) || error.message || String(error)
      this.logger.forBot().error('Error starting agent chat:', errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  public async getCustomer(customerAccessToken: string, organizationId: string): Promise<any> {
    validateRequiredParams({ customerAccessToken, organizationId }, 'getCustomer')

    this.logger.forBot().debug(`Using organization ID: ${organizationId}`)

    const url = `https://api.livechatinc.com/v3.5/customer/action/get_customer?organization_id=${encodeURIComponent(organizationId)}`
    const payload = {}

    this.logger.forBot().debug(`getCustomer URL: ${url}`)

    try {
      this.logger.forBot().info('Getting customer information...')
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${customerAccessToken}`,
          'Content-Type': 'application/json',
        },
      })

      return { success: true, data: response.data }
    } catch (error: any) {
      const errorMessage = JSON.stringify(error.response?.data) || error.message || String(error)
      this.logger.forBot().error('Error getting customer:', errorMessage)
      if (error.response?.data) {
        this.logger.forBot().error('Error response data:', JSON.stringify(error.response.data))
      }
      return { success: false, message: errorMessage }
    }
  }

  public async addCustomerToChat(
    agentToken: string,
    chatId: string,
    customerAccessToken: string,
    customerData: {
      email?: string
      name?: string
    }
  ): Promise<any> {
    validateRequiredParams({ agentToken, chatId, customerAccessToken }, 'addCustomerToChat')

    this.logger.forBot().debug(`addCustomerToChat - organizationId: ${this.organizationId}`)

    const customerResult = await this.getCustomer(customerAccessToken, this.organizationId)
    if (!customerResult.success) {
      this.logger.forBot().error(`Failed to get customer: ${customerResult.message}`)
      return {
        success: false,
        message: `Failed to get customer: ${customerResult.message}`,
      }
    }

    const customerId = customerResult.data.id
    if (!customerId) {
      this.logger.forBot().error('No customer ID found in customer data')
      return {
        success: false,
        message: 'No customer ID found in customer data',
      }
    }

    const url = 'https://api.livechatinc.com/v3.5/agent/action/add_user_to_chat'
    const payload = {
      chat_id: chatId,
      user_id: customerId,
      user_type: 'customer',
      visibility: 'all',
      ignore_requester_presence: true,
      ...customerData,
    }

    this.logger.forBot().debug(`addCustomerToChat payload:`, payload)

    try {
      this.logger.forBot().info(`Adding customer ${customerId} to chat ${chatId}...`)
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Basic ${agentToken}`,
          'Content-Type': 'application/json',
        },
      })

      return { success: true, data: response.data }
    } catch (error: any) {
      const errorMessage = JSON.stringify(error.response?.data) || error.message || String(error)
      this.logger.forBot().error('Error adding customer to chat:', errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  public async validateGroup(agentToken: string, groupId: number): Promise<any> {
    validateRequiredParams({ agentToken, groupId }, 'validateGroup')

    const url = 'https://api.livechatinc.com/v3.5/agent/action/get_groups'

    try {
      this.logger.forBot().debug(`Validating group ${groupId}...`)
      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${agentToken}`,
          'Content-Type': 'application/json',
        },
      })

      const groups: LiveChatGroup[] = response.data?.groups || []
      const targetGroup = groups.find((group) => group.id === groupId)

      if (!targetGroup) {
        return {
          success: false,
          message: `Group ${groupId} not found. Available groups: ${groups.map((g) => g.id).join(', ')}`,
        }
      }

      if (!targetGroup.agents || targetGroup.agents.length === 0) {
        return {
          success: false,
          message: `Group ${groupId} has no agents assigned`,
        }
      }

      this.logger.forBot().debug(`Group ${groupId} validation successful. Agents: ${targetGroup.agents.length}`)
      return { success: true, data: targetGroup }
    } catch (error: any) {
      const errorData = JSON.stringify(error.response?.data) || error.message || String(error)
      this.logger.forBot().error('Error validating group:', errorData)
      return { success: false, message: errorData }
    }
  }

  public async transferChat(agentToken: string, chatId: string, targetGroupId: number): Promise<any> {
    validateRequiredParams({ agentToken, chatId, targetGroupId }, 'transferChat')

    const url = 'https://api.livechatinc.com/v3.5/agent/action/transfer_chat'
    const payload = {
      id: chatId,
      target: {
        type: 'group',
        ids: [targetGroupId],
      },
    }

    try {
      this.logger.forBot().info(`Transferring chat ${chatId} to group ${targetGroupId}...`)

      this.logger.forBot().debug(`Transfer payload:`, payload)

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Basic ${agentToken}`,
          'Content-Type': 'application/json',
        },
      })

      this.logger.forBot().info(`Chat ${chatId} transferred successfully to group ${targetGroupId}`)
      return { success: true, data: response.data }
    } catch (error: any) {
      const rawErrorData = error.response?.data
      const errorData = JSON.stringify(rawErrorData) || error.message || String(error)
      this.logger.forBot().error('Error transferring chat:', errorData)

      if (
        rawErrorData?.error?.type === 'validation' &&
        rawErrorData?.error?.message?.includes('Cannot assign any agent from requested groups')
      ) {
        this.logger
          .forBot()
          .error(`Group ${targetGroupId} validation failed: No available agents or invalid group configuration`)
        return {
          success: false,
          message: `Group ${targetGroupId} has no available agents or invalid configuration. Please verify the group exists and has active agents assigned.`,
          error: errorData,
        }
      }

      return { success: false, message: errorData, error: errorData }
    }
  }
}

export const getClient = (clientId: string, organizationId: string, logger: bp.Logger) => {
  return new LiveChatApi(clientId, organizationId, logger)
}
