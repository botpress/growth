import axios, { AxiosError } from "axios";
import * as bp from ".botpress";

const hubspot_api_base_url = "https://api.hubapi.com";

/**
 * A class for interacting with HubSpot's API via Botpress integrations.
 */
export class HubSpotApi {
  private ctx: bp.Context;
  private bpClient: bp.Client;
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;
  private logger: bp.Logger;

  /**
   * Creates an instance of HubSpotApi.
   *
   * @param {bp.Context} ctx - Botpress integration context.
   * @param {bp.Client} bpClient - Botpress client for managing state.
   * @param {string} refreshToken - HubSpot refresh token.
   * @param {string} clientId - HubSpot client ID.
   * @param {string} clientSecret - HubSpot client secret.
   * @param {bp.Logger} logger - Botpress logger instance.
   */
  constructor(
    ctx: bp.Context,
    bpClient: bp.Client,
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    logger: bp.Logger
  ) {
    this.ctx = ctx;
    this.bpClient = bpClient;
    this.refreshToken = refreshToken;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.logger = logger;
  }

  /**
   * Retrieves the stored access token from Botpress integration state.
   *
   * @returns {Promise<{ accessToken: string } | null>} Access token if found, otherwise null.
   */
  async getStoredCredentials(): Promise<{ accessToken: string } | null> {
    try {
      const { state } = await this.bpClient.getState({
        id: this.ctx.integrationId,
        name: "credentials",
        type: "integration",
      });

      if (!state?.payload?.accessToken) {
        this.logger.forBot().info("No credentials found in state");
        return null;
      }

      return {
        accessToken: state.payload.accessToken,
      };
    } catch (error) {
      this.logger
        .forBot()
        .error("Error retrieving credentials from state:", error);
      return null;
    }
  }

  /**
   * Refreshes the HubSpot access token using the refresh token and updates Botpress state.
   *
   * @returns {Promise<void>}
   */
  async refreshAccessToken(): Promise<void> {
    try {
      const requestData = new URLSearchParams();
      requestData.append("client_id", this.clientId);
      requestData.append("client_secret", this.clientSecret);
      requestData.append("refresh_token", this.refreshToken);
      requestData.append("grant_type", "refresh_token");

      const response = await axios.post(
        "https://api.hubapi.com/oauth/v1/token",
        requestData.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      this.logger
        .forBot()
        .info("Response from HubSpot API REFRESH TOKEN:", response.data);

      await this.bpClient.setState({
        id: this.ctx.integrationId,
        type: "integration",
        name: "credentials",
        payload: {
          accessToken: response.data.access_token,
        },
      });

      this.logger.forBot().info("Access token refreshed successfully.");
    } catch (error: unknown) {
      const err = error as AxiosError;
      this.logger
        .forBot()
        .error(
          "Error refreshing access token:",
          err.response?.data || err.message
        );
    }
  }

  /**
   * Makes an authenticated HTTP request to the HubSpot API.
   * Automatically refreshes token and retries on 401 errors.
   *
   * @param {string} endpoint - The HubSpot API endpoint.
   * @param {string} [method="GET"] - The HTTP method.
   * @param {*} [data=null] - Optional request body.
   * @param {*} [params={}] - Optional query parameters.
   * @returns {Promise<any>} Response data or error object.
   */
  private async makeHitlRequest(
    endpoint: string,
    method: string = "GET",
    data: any = null,
    params: any = {}
  ): Promise<any> {
    try {
      const creds = await this.getStoredCredentials();
      if (!creds) throw new Error("Missing credentials");

      const headers: Record<string, string> = {
        Authorization: `Bearer ${creds.accessToken}`,
        Accept: "application/json",
      };

      if (method !== "GET" && method !== "DELETE") {
        headers["Content-Type"] = "application/json";
      }

      this.logger.forBot().info(`Making request to ${method} ${endpoint}`);
      this.logger.forBot().debug("Params:", params);

      const response = await axios({
        method,
        url: endpoint,
        headers,
        data,
        params,
      });

      return {
        success: true,
        message: "Request successful",
        data: response.data,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.logger
          .forBot()
          .warn("Access token may be expired. Attempting refresh...");
        const creds = await this.getStoredCredentials();
        if (creds?.accessToken) {
          await this.refreshAccessToken();
          return this.makeHitlRequest(endpoint, method, data, params);
        }
      }

      this.logger
        .forBot()
        .error("HubSpot API error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: null,
      };
    }
  }

  /**
   * Fetches thread information from HubSpot Conversations API.
   *
   * @param {string} threadId - The thread ID.
   * @returns {Promise<any>} The thread information.
   */
  public async getThreadInfo(threadId: string): Promise<any> {
    const endpoint = `${hubspot_api_base_url}/conversations/v3/conversations/threads/${threadId}`;
    const response = await this.makeHitlRequest(endpoint, "GET");

    if (!response.success || !response.data) {
      throw new Error(`Failed to fetch thread info: ${response.message}`);
    }

    return response.data;
  }

  /**
   * Fetches a HubSpot contact's phone number by contactId.
   *
   * @param {string} contactId - The ID of the contact.
   * @returns {Promise<string>} The contact object's phone number.
   */
  public async getActorPhoneNumber(contactId: string): Promise<any> {
    const endpoint = `${hubspot_api_base_url}/crm/v3/objects/contacts/${contactId}?properties=phone`;
    const response = await this.makeHitlRequest(endpoint, "GET", null, {
      archived: false,
    });

    if (!response.success || !response.data) {
      throw new Error(`Failed to fetch contact by ID: ${response.message}`);
    }

    return response.data.properties.phone;
  }

  /**
   * Fetches email of a HubSpot actor (user).
   *
   * @param {string} actorId - The actor ID.
   * @returns {Promise<string>} The actor's email.
   */
  public async getActorEmail(actorId: string): Promise<any> {
    const endpoint = `${hubspot_api_base_url}/conversations/v3/conversations/actors/${actorId}`;
    const response = await this.makeHitlRequest(endpoint, "GET");

    if (!response.success || !response.data) {
      throw new Error(`Failed to fetch actor info: ${response.message}`);
    }

    return response.data.email;
  }

  /**
   * Creates a custom HubSpot channel.
   *
   * @param {string} developerApiKey - Developer API key.
   * @param {string} appId - App ID.
   * @returns {Promise<string>} ID of the created channel.
   */
  async createCustomChannel(
    developerApiKey: string,
    appId: string
  ): Promise<any> {
    const response = await this.makeHitlRequest(
      `${hubspot_api_base_url}/conversations/v3/custom-channels?hapikey=${developerApiKey}&appId=${appId}`,
      "POST",
      {
        name: "Botpress",
        webhookUrl: `https://webhook.botpress.cloud/${this.ctx.webhookId}`,
        capabilities: {
          deliveryIdentifierTypes: ["CHANNEL_SPECIFIC_OPAQUE_ID"],
          richText: ["HYPERLINK", "TEXT_ALIGNMENT", "BLOCKQUOTE"],
          threadingModel: "INTEGRATION_THREAD_ID",
          allowInlineImages: true,
          allowOutgoingMessages: true,
          allowConversationStart: true,
          maxFileAttachmentCount: 1,
          allowMultipleRecipients: false,
          outgoingAttachmentTypes: ["FILE"],
          maxFileAttachmentSizeBytes: 1000000,
          maxTotalFileAttachmentSizeBytes: 1000000,
          allowedFileAttachmentMimeTypes: ["image/png"],
        },
        channelAccountConnectionRedirectUrl: "https://example.com",
        channelDescription: "Botpress custom channel integration.",
        channelLogoUrl: "https://i.imgur.com/CAu3kb7.png",
      }
    );

    if (!response.success || !response.data) {
      throw new Error(`HubSpot createConversation failed: ${response.message}`);
    }

    return response.data.id;
  }

  /**
   * Retrieves the list of custom channels.
   *
   * @returns {Promise<any>} A list of custom channels.
   */
  public async getCustomChannels(): Promise<any> {
    try {
      const response = await axios.get(
        `${hubspot_api_base_url}/conversations/v3/custom-channels`,
        {
          params: {
            hapikey: this.ctx.configuration.developerApiKey,
            appId: this.ctx.configuration.appId,
          },
          headers: {
            Accept: "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      this.logger
        .forBot()
        .error(
          "Failed to fetch custom channels:",
          error.response?.data || error.message
        );
      throw error;
    }
  }

  /**
   * Connects a HubSpot custom channel to a specific inbox.
   *
   * @param {string} channelId - The channel ID.
   * @param {string} inboxId - The inbox ID.
   * @param {string} channelName - The name to assign to the channel.
   * @returns {Promise<any>} The connection result.
   */
  public async connectCustomChannel(
    channelId: string,
    inboxId: string,
    channelName: string
  ): Promise<any> {
    const endpoint = `https://api.hubapi.com/conversations/v3/custom-channels/${channelId}/channel-accounts`;

    const payload = {
      inboxId: inboxId,
      name: channelName,
      deliveryIdentifier: {
        type: "CHANNEL_SPECIFIC_OPAQUE_ID",
        value: "botpress",
      },
      authorized: true,
    };

    try {
      const response = await this.makeHitlRequest(endpoint, "POST", payload);

      return response;
    } catch (error) {
      this.logger.forBot().error("Error connecting custom channel:", error);
      throw error;
    }
  }

  /**
   * Starts a new conversation in HubSpot.
   *
   * @param {string} channelId - The channel ID.
   * @param {string} channelAccountId - The channel account ID.
   * @param {string} integrationThreadId - The thread ID.
   * @param {string} name - Sender's name.
   * @param {string} email - Sender's email.
   * @param {string} title - Message title (not used).
   * @param {string} description - Message description (not used).
   * @returns {Promise<any>} The conversation response.
   */
  public async createConversation(
    channelId: string,
    channelAccountId: string,
    integrationThreadId: string,
    name: string,
    phoneNumber: string,
    title: string,
    description: string
  ): Promise<any> {
    const endpoint = `${hubspot_api_base_url}/conversations/v3/custom-channels/${channelId}/messages`;
    const payload = {
      text: `Title: ${title} \nDescription: ${description}`,
      messageDirection: "INCOMING",
      integrationThreadId: integrationThreadId,
      channelAccountId: channelAccountId,
      senders: [
        {
          phoneNumber: phoneNumber,
          deliveryIdentifier: {
            type: "HS_PHONE_NUMBER",
            value: phoneNumber,
          },
        },
      ],
    };

    try {
      const response = await this.makeHitlRequest(endpoint, "POST", payload);
      return response;
    } catch (error) {
      this.logger.forBot().error("Error sending message to HubSpot:", error);
      throw error;
    }
  }

  /**
   * Sends a message to an existing HubSpot conversation.
   *
   * @param {string} message - Message content.
   * @param {string} senderName - Sender's name.
   * @param {string} senderEmail - Sender's email.
   * @returns {Promise<any>} The message response.
   */
  public async sendMessage(
    message: string,
    senderName: string,
    senderPhoneNumber: string,
    integrationThreadId: string
  ): Promise<any> {
    const { state } = await this.bpClient.getState({
      id: this.ctx.integrationId,
      name: "channelInfo",
      type: "integration",
    });

    if (!state?.payload?.channelId || !state?.payload?.channelAccountId) {
      return {
        success: false,
        message: "Missing channel info",
        data: null,
        conversationId: "error_conversation_id",
      };
    }

    const { channelId, channelAccountId } = state.payload;

    const endpoint = `${hubspot_api_base_url}/conversations/v3/custom-channels/${channelId}/messages`;

    const payload = {
      type: "MESSAGE",
      text: message,
      messageDirection: "INCOMING",
      integrationThreadId: integrationThreadId,
      channelAccountId: channelAccountId,
      senders: [
        {
          name: senderName,
          deliveryIdentifier: {
            type: "HS_PHONE_NUMBER",
            value: senderPhoneNumber,
          },
        },
      ],
    };

    try {
      const response = await this.makeHitlRequest(endpoint, "POST", payload);
      return response;
    } catch (error) {
      this.logger.forBot().error("Error sending message to HubSpot:", error);
      throw error;
    }
  }
}

/**
 * Factory function to create a HubSpotApi instance.
 *
 * @param {bp.Context} ctx - Botpress context.
 * @param {bp.Client} bpClient - Botpress client.
 * @param {string} refreshToken - HubSpot refresh token.
 * @param {string} clientId - HubSpot client ID.
 * @param {string} clientSecret - HubSpot client secret.
 * @param {bp.Logger} logger - Botpress logger instance.
 * @returns {HubSpotApi} An instance of HubSpotApi.
 */
export const getClient = (
  ctx: bp.Context,
  bpClient: bp.Client,
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  logger: bp.Logger
) => {
  return new HubSpotApi(
    ctx,
    bpClient,
    refreshToken,
    clientId,
    clientSecret,
    logger
  );
};
