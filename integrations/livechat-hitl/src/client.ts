import axios, { AxiosError } from "axios";
import * as bp from ".botpress";

const LIVECHAT_API_ACTION_URL =
  "https://api.livechatinc.com/v3.5/customer/action";

/**
 * Validates required parameters for API methods
 * @throws Error if validation fails
 */
function validateRequiredParams(
  params: Record<string, any>,
  methodName: string,
) {
  const missingParams = Object.entries(params)
    .filter(
      ([_, value]) => value === undefined || value === null || value === "",
    )
    .map(([key]) => key);

  if (missingParams.length > 0) {
    throw new Error(
      `Missing required parameters for ${methodName}: ${missingParams.join(", ")}`,
    );
  }
}

/**
 * A class for interacting with the LiveChat Customer API using OAuth2.
 */
export class LiveChatApi {
  private clientId: string;
  private organizationId: string;
  private logger: bp.Logger;

  constructor(clientId: string, organizationId: string, logger: bp.Logger) {
    validateRequiredParams(
      { clientId, organizationId, logger },
      "LiveChatApi constructor",
    );
    this.clientId = clientId;
    this.organizationId = organizationId;
    this.logger = logger;
  }

  /**
   * Creates a new customer and returns a customer access token for HITL conversations.
   */
  public async createCustomerToken(redirectUri?: string): Promise<{
    access_token: string;
    entity_id: string;
    expires_in: number;
    token_type: string;
    organization_id: string;
  }> {
    const url = "https://accounts.livechat.com/v2/customer/token";
    const payload: any = {
      grant_type: "cookie",
      client_id: this.clientId,
      organization_id: this.organizationId,
    };
    if (redirectUri) payload.redirect_uri = redirectUri;

    try {
      this.logger.forBot().info("Requesting new customer access token...");
      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error: any) {
      this.logger
        .forBot()
        .error(
          "Error creating customer token:",
          error.response?.data || error.message,
        );
      throw error;
    }
  }

  private async makeRequest(
    actionName: string,
    payload: object = {},
    accessToken: string,
  ): Promise<any> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    const url = `${LIVECHAT_API_ACTION_URL}/${actionName}?organization_id=${encodeURIComponent(this.organizationId)}`;
    try {
      this.logger
        .forBot()
        .info(`Making request to LiveChat action: ${actionName}`);
      const response = await axios.post(url, payload, { headers });
      return { success: true, data: response.data };
    } catch (error) {
      const err = error as AxiosError;
      this.logger
        .forBot()
        .error(
          `LiveChat API error for action '${actionName}':`,
          err.response?.data || err.message,
        );
      return { success: false, message: err.response?.data || err.message };
    }
  }

  public async startChat(
    title: string,
    description: string,
    accessToken: string,
  ): Promise<any> {
    // Special validation for startChat where description can be empty string
    validateRequiredParams({ title, accessToken }, "startChat");
    if (description === null || description === undefined) {
      throw new Error("Missing required parameter for startChat: description");
    }

    const payload = {
      chat: {
        thread: {
          events: [
            {
              type: "message",
              text: `${title}\n\n${description}`,
              visibility: "all",
            },
          ],
        },
      },
      continuous: true,
    };
    return this.makeRequest("start_chat", payload, accessToken);
  }

  public async sendMessage(
    chatId: string,
    message: string,
    accessToken: string,
  ): Promise<any> {
    validateRequiredParams({ chatId, message, accessToken }, "sendMessage");

    const payload = {
      chat_id: chatId,
      event: { type: "message", text: message, visibility: "all" },
    };
    return this.makeRequest("send_event", payload, accessToken);
  }

  public async getChat(chatId: string, accessToken: string): Promise<any> {
    validateRequiredParams({ chatId, accessToken }, "getChat");

    return this.makeRequest("get_chat", { chat_id: chatId }, accessToken);
  }

  public async listChats(accessToken: string): Promise<any> {
    validateRequiredParams({ accessToken }, "listChats");

    return this.makeRequest("list_chats", {}, accessToken);
  }

  public async deactivateChat(
    chatId: string,
    accessToken: string,
  ): Promise<any> {
    validateRequiredParams({ chatId, accessToken }, "deactivateChat");

    const payload = {
      id: chatId,
    };
    return this.makeRequest("deactivate_chat", payload, accessToken);
  }

  public async getOrganizationId(
    licenseId: string,
    accessToken: string,
  ): Promise<any> {
    validateRequiredParams({ licenseId, accessToken }, "getOrganizationId");

    const url = `https://api.livechatinc.com/v3.4/configuration/action/get_organization_id?license_id=${encodeURIComponent(licenseId)}`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    try {
      this.logger
        .forBot()
        .info(`Requesting organization_id for license_id: ${licenseId}`);
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error: any) {
      this.logger
        .forBot()
        .error(
          "Error fetching organization_id:",
          error.response?.data || error.message,
        );
      throw error;
    }
  }

  public async customerUpdate(
    accessToken: string,
    customerData: {
      email?: string;
    },
  ): Promise<any> {
    validateRequiredParams({ accessToken, customerData }, "customerUpdate");

    return this.makeRequest("update_customer", customerData, accessToken);
  }
}

/**
 * Factory function to create a LiveChatApi instance.
 */
export const getClient = (
  clientId: string,
  organizationId: string,
  logger: bp.Logger,
) => {
  return new LiveChatApi(clientId, organizationId, logger);
};
