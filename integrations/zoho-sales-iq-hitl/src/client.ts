import axios, { AxiosError } from "axios";
import * as bp from '.botpress'
import * as bpclient from "@botpress/client";

import { IntegrationLogger } from '@botpress/sdk';

const logger = new IntegrationLogger();

// Zoho Data Centers
const zohoAuthUrls = new Map<string, string>([
  ['us', 'https://accounts.zoho.com'],
  ['eu', 'https://accounts.zoho.eu'],
  ['in', 'https://accounts.zoho.in'],
  ['au', 'https://accounts.zoho.com.au'],
  ['cn', 'https://accounts.zoho.com.cn'],
  ['jp', 'https://accounts.zoho.jp'],
  ['ca', 'https://accounts.zohocloud.ca'],
]);

// Function to get the Zoho Auth URL
const getZohoAuthUrl = (region: string): string => 
  zohoAuthUrls.get(region) ?? "https://accounts.zoho.ca";

const zohosalesiq_server_uri = "https://salesiq.zohocloud.ca"

export class ZohoApi {
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;
  private dataCenter: string;
  private baseUrl: string;
  private ctx: bp.Context;
  private bpClient: bp.Client;

  constructor(refreshToken: string, clientId: string, clientSecret: string, dataCenter: string, ctx: bp.Context, bpClient: bp.Client) {
    this.refreshToken = refreshToken;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.dataCenter = dataCenter;
    this.ctx = ctx;
    this.bpClient = bpClient;
    this.baseUrl = `https://www.zohoapis.${dataCenter}`;
  }

  async getStoredCredentials(): Promise<{ accessToken: string } | null> {
    try {
      const { state } = await this.bpClient.getState({
        id: this.ctx.integrationId,
        name: "credentials",
        type: "integration",
      });

      if (!state?.payload?.accessToken) {
        logger.forBot().error("No credentials found in state");
        return null;
      }

      return {
        accessToken: state.payload.accessToken,
      };
    } catch (error) {
      logger.forBot().error("Error retrieving credentials from state:", error);
      return null;
    }
  }

  private async makeHitlRequest(endpoint: string, method: string = "GET", data: any = null, params: any = {}): Promise<any> {
    try {
      const creds = await this.getStoredCredentials();
      if (!creds) {
        logger.forBot().error("Error retrieving credentials.");
        throw new bpclient.RuntimeError(
          "Error grabbing credentials."
        );
      }
  
      const headers: Record<string, string> = {
        Authorization: `Bearer ${creds.accessToken}`,
        Accept: "application/json",
      };
      logger.forBot().info("accessToken", creds.accessToken);
      if (method !== "GET" && method !== "DELETE") {
        headers["Content-Type"] = "application/json";
      }
      logger.forBot().info(`Making request to ${method} ${endpoint}`);
      logger.forBot().info("Params:", params);

      const response = await axios({
        method,
        url: `${endpoint}`,
        headers,
        data,
        params,
      });
  
      return { 
        success: true, 
        message: "Request successful", 
        data: response.data 
      };
    } catch (error: any) {
      logger.forBot().error(error.response);

      if (error.response?.status === 401 || error.response?.status === 400) {
        logger.forBot().warn("Access token expired. Refreshing...", error);

        await this.refreshAccessToken();
        return this.makeHitlRequest(endpoint, method, data, params);
      }

      logger.forBot().error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);

      return { 
        success: false, 
        message: error.response?.data?.message || error.message, 
        data: null 
      };
    }
  }
  
  async refreshAccessToken() {
    try {
      const requestData = new URLSearchParams();
      requestData.append("client_id", this.clientId);
      requestData.append("client_secret", this.clientSecret);
      requestData.append("refresh_token", this.refreshToken);
      requestData.append("grant_type", "refresh_token");

      const response = await axios.post(`${getZohoAuthUrl(this.ctx.configuration.dataCenter)}/oauth/v2/token`, requestData.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      logger.forBot().error(response);

      await this.bpClient.setState({
        id: this.ctx.integrationId,
        type: "integration",
        name: 'credentials',
        payload: {
          accessToken: response.data.access_token,
        },
      });

      logger.forBot().info("Access token refreshed successfully.");
    } catch (error: unknown) {
      const err = error as AxiosError;
      logger.forBot().error("Error refreshing access token:", err.response?.data || err.message);
      throw new bpclient.RuntimeError(
        "Authentication error. Please reauthorize the integration."
      );
    }
  }

  public async createConversation(name: string, email: string, title: string, description: string): Promise<any> {
    const { data } = await this.makeHitlRequest(`${zohosalesiq_server_uri}/api/visitor/v1/${this.ctx.configuration.screenName}/conversations`, "POST", {
      "visitor": {
        "user_id": email,
        "name": name,
        "email": email,
      },
      "app_id": this.ctx.configuration.appId,
      "department_id": this.ctx.configuration.departmentId, 
      "question": `Botpress - ${title} - ${description}`
    });
  
    return data
  }

  public async sendMessage(conversationId: string, message: string) {
    const endpoint = `${zohosalesiq_server_uri}/api/visitor/v1/${this.ctx.configuration.screenName}/conversations/${conversationId}/messages`;

    const payload = { text: message };

    try {
      const response = await this.makeHitlRequest(endpoint, "POST", payload);

      if (response.success) {
        logger.forBot().info("Message sent successfully:", response.data);
      } else {
        logger.forBot().error("Failed to send message:", response.message);
      }

      return response;
    } catch (error) {
      logger.forBot().error("Error sending message to Zoho SalesIQ:", error);
      throw error;
    }
  }

  public async getApp(): Promise<any> {
    const { data } = await this.makeHitlRequest(`${zohosalesiq_server_uri}/api/v2/${this.ctx.configuration.screenName}/apps/${this.ctx.configuration.appId}`);
    return data
  }

  public async getDepartment(): Promise<any> {
    const { data } = await this.makeHitlRequest(`${zohosalesiq_server_uri}/api/v2/${this.ctx.configuration.screenName}/departments/${this.ctx.configuration.departmentId}`);
    return data
  }
}

export const getClient = (
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  dataCenter: string,
  ctx: bp.Context,
  bpClient: bp.Client
) => {
  return new ZohoApi(refreshToken, clientId, clientSecret, dataCenter, ctx, bpClient);
};
