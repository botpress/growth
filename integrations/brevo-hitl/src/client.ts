import axios from "axios";
import * as bp from ".botpress";
import { IntegrationLogger } from "@botpress/sdk";

const logger = new IntegrationLogger();

const BREVO_API_URL = "https://api.brevo.com/v3";

export class BrevoApi {
  private apiKey: string;
  private agentId: string;

  constructor(ctx: bp.Context) {
    this.apiKey = ctx.configuration.apiKey;
    this.agentId = ctx.configuration.agentId;
  }

  private async makeRequest(method: "GET" | "POST", path: string, data?: any) {
    try {
      const response = await axios({
        method,
        url: `${BREVO_API_URL}${path}`,
        data,
        headers: {
          accept: "application/json",
          "api-key": this.apiKey,
          "content-type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      const err = error as any;
      logger
        .forBot()
        .error(
          `Brevo API Error: ${err.response?.data?.message || err.message}`,
        );
      throw err;
    }
  }

  // Creates a conversation by sending the first message
  async createConversation(visitorId: string, text: string) {
    const payload: any = {
      visitorId,
      text,
      agentId: this.agentId,
    };

    logger.forBot().info("payload for createConversation", payload);
    return this.makeRequest("POST", "/conversations/messages", payload);
  }

  // Sends a message to an existing Brevo conversation
  async sendMessage(text: string, brevoConversationId: string) {
    let message = `*Botpress User (${brevoConversationId})*: ${text}`;
    const payload: any = {
      visitorId: brevoConversationId,
      text: message,
      agentId: this.agentId,
      receivedFrom: "Botpress",
    };
    logger
      .forBot()
      .info("payload for sendMessage to existing conversation", payload);
    return this.makeRequest("POST", "/conversations/messages", payload);
  }

  // Gets account details to validate API key
  async getAccountDetails() {
    return this.makeRequest("GET", "/account");
  }
}

export const getClient = (ctx: bp.Context) => {
  return new BrevoApi(ctx);
};
