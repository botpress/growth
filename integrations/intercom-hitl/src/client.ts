import axios, { AxiosError } from "axios";
import * as bp from ".botpress";

const INTERCOM_API_BASE_URL = "https://api.intercom.io";

function validateRequiredParams(params: Record<string, any>, methodName: string) {
  const missingParams = Object.entries(params)
    .filter(([_, value]) => value === undefined || value === null || value === '')
    .map(([key]) => key);

  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters for ${methodName}: ${missingParams.join(', ')}`);
  }
}

export class IntercomApi {
  private accessToken: string;
  private logger: bp.Logger;

  constructor(
    accessToken: string,
    logger: bp.Logger
  ) {
    validateRequiredParams({ accessToken, logger }, 'IntercomApi constructor');
    this.accessToken = accessToken;
    this.logger = logger;
  }

  public async getAdmins(): Promise<any> {
    return this.makeRequest('GET', '/admins');
  }

  public async searchContactByEmail(email: string): Promise<any> {
    validateRequiredParams({ email }, 'searchContactByEmail');
    
    const searchData = {
      query: {
        operator: "AND",
        value: [
          {
            field: "email",
            operator: "=",
            value: email
          }
        ]
      },
    };
    
    return this.makeRequest('POST', '/contacts/search', searchData);
  }

  public async getContactById(contactId: string): Promise<any> {
    validateRequiredParams({ contactId }, 'getContactById');
    
    return this.makeRequest('GET', `/contacts/${contactId}`);
  }

  public async createContact(email: string): Promise<any> {
    validateRequiredParams({ email }, 'createContact');
    
    const contactData = {
      email: email
    };
    
    return this.makeRequest('POST', '/contacts', contactData);
  }

  public async createConversation(intercomContactId: string, email: string, description: string): Promise<any> {
    validateRequiredParams({ intercomContactId, email }, 'createConversation');
    
    this.logger.forBot().info(`Creating Intercom conversation with contact ID: ${intercomContactId} for email: ${email}`);
    
    const conversationData = {
      from: {
        type: "user",
        id: intercomContactId
      },
      body: "Botpress HITL Started for " + email + " with description: " + description
    };
    
    return this.makeRequest('POST', '/conversations', conversationData);
  }

  public async updateConversation(conversationId: string, title?: string, customAttributes?: Record<string, any>): Promise<any> {
    validateRequiredParams({ conversationId }, 'updateConversation');
    
    this.logger.forBot().info(`Updating Intercom conversation: ${conversationId} with title: ${title}`);
    
    const updateData: Record<string, any> = {};
    
    if (title !== undefined) {
      updateData.title = title;
    }
    
    if (customAttributes !== undefined) {
      updateData.custom_attributes = customAttributes;
    }
    
    return this.makeRequest('PUT', `/conversations/${conversationId}?display_as=plaintext`, updateData);
  }

  public async closeConversation(conversationId: string, body: string = "Goodbye :)"): Promise<any> {
    validateRequiredParams({ conversationId }, 'closeConversation');
    
    this.logger.forBot().info(`Getting admins to close conversation: ${conversationId}`);
    const adminsResponse = await this.getAdmins();
    
    if (!adminsResponse.success) {
      throw new Error(`Failed to get admins: ${adminsResponse.message}`);
    }
    
    const admins = adminsResponse.data?.admins || adminsResponse.data?.data?.admins;
    if (!admins || admins.length === 0) {
      throw new Error('No admins found in Intercom account');
    }
    
    const firstAdmin = admins[0];
    const adminId = firstAdmin.id;
    
    this.logger.forBot().info(`Using admin ID ${adminId} to close conversation: ${conversationId}`);
    
    const closeData = {
      message_type: "close",
      type: "admin",
      admin_id: adminId,
      body: body
    };
    
    return this.makeRequest('POST', `/conversations/${conversationId}/parts`, closeData);
  }

  public async replyToConversation(
    conversationId: string,
    intercomUserId: string,
    body: string,
    attachmentUrls?: string[],
    attachmentFiles?: { name: string; content_type: string; data: string }[]
  ): Promise<any> {
    validateRequiredParams({ conversationId, intercomUserId, body }, 'replyToConversation');
    
    const replyData: Record<string, any> = {
      message_type: "comment",
      type: "user",
      intercom_user_id: intercomUserId,
      body: body,
      ...(attachmentUrls && attachmentUrls.length ? { attachment_urls: attachmentUrls } : {}),
      ...(attachmentFiles && attachmentFiles.length ? { attachment_files: attachmentFiles } : {})
    };
    
    return this.makeRequest('POST', `/conversations/${conversationId}/reply`, replyData);
  }

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Intercom-Version': '2.14',
      "Content-Type": "application/json",
    };
    
    const url = `${INTERCOM_API_BASE_URL}${endpoint}`;
    
    try {
      this.logger.forBot().info(`Making ${method} request to Intercom: ${endpoint}`);
      const response = await axios({
        method,
        url,
        headers,
        data,
      });
      return { success: true, data: response.data };
    } catch (error) {
      const err = error as AxiosError;
      this.logger.forBot().error(`Intercom API error for ${method} ${endpoint}:`, err.response?.data || err.message);
      return { success: false, message: err.response?.data || err.message };
    }
  }
}

export const getClient = (
  accessToken: string,
  logger: bp.Logger
) => {
  return new IntercomApi(accessToken, logger);
};