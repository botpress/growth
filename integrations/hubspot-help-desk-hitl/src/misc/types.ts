import type * as botpress from ".botpress";
import { HubSpotApi } from "../client";

export type Config = botpress.configuration.Configuration;
export type Implementation = ConstructorParameters<
  typeof botpress.Integration
>[0];

export type RegisterFunction = Implementation["register"];
export type UnregisterFunction = Implementation["unregister"];
export type Channels = Implementation["channels"];
export type Handler = Implementation["handler"];
export type Client = botpress.Client;

// HubSpot Event Types
export interface HubSpotEvent {
  objectId: string;
  eventType: string;
  timestamp: number;
  subscriptionType: string;
  portalId: number;
  appId: number;
  subscriptionId: number;
  attemptNumber: number;
  objectType: string;
  propertyName?: string;
  propertyValue?: string;
  message?: HubSpotMessage;
}

// Message Types
export interface HubSpotMessage {
  conversationsThreadId: string;
  text: string;
  senders?: HubSpotSender[];
  recipients?: HubSpotRecipient[];
}

export interface HubSpotRecipient {
  actorId: string;
}

export interface HubSpotSender {
  actorId: string;
}

// Thread Info Types
export interface ThreadSender {
  deliveryIdentifier: {
    type: "HS_EMAIL_ADDRESS" | "HS_PHONE_NUMBER";
    value: string;
  };
}

export interface ThreadInfo {
  id: string;
  associatedContactId: string;
  senders?: ThreadSender[];
}

// Event Handler Parameters
export interface OperatorAssignedUpdateParams {
  hubspotEvent: HubSpotEvent;
  client: Client;
  hubSpotClient: HubSpotApi;
  logger: botpress.Logger;
}

export interface ConversationCompletedParams {
  hubspotEvent: HubSpotEvent;
  client: Client;
}

export interface OperatorSendMessageParams {
  hubspotEvent: HubSpotEvent;
  client: Client;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}
