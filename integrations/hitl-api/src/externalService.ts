import axios from 'axios'
import {
  PingPayload,
  CreateRemoteConversationPayload,
  CloseRemoteTicketPayload,
  CreateRemoteUserPayload,
  BotSendsMessagePayload,
  CreateRemoteConversationResponse,
  CreateRemoteUserResponse,
} from './types'

/**
 * @swagger
 * /ping:
 *   post:
 *     summary: Ping your service
 *     tags:
 *      - Endpoints to implement
 *     description: An authenticated endpoint that allows your service to say it's ready to receive requests. Your service must return a 200 response.
 *     operationId: pingExternalService
 *     responses:
 *       200:
 *         description: Successful ping.
 */
export const pingExternalService = async (endpointBaseUrl: string) => {
  const pingPayload = PingPayload.parse({
    type: 'ping',
  })
  const response = await axios.post(`${endpointBaseUrl}/ping`, pingPayload)
  return response.data
}

/**
 * @swagger
 * /createRemoteConversation:
 *   post:
 *     summary: Create a conversation in your service
 *     tags:
 *      - Endpoints to implement
 *     description: Creates a remote conversation on your service. This is required for the HITL process to work. Your service must return payload with an id for the conversation in the live agent system.
 *     operationId: createRemoteConversation
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRemoteConversationPayload'
 *     responses:
 *       200:
 *         description: Conversation created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateRemoteConversationResponse'
 */
export const createRemoteConversation = async (endpointBaseUrl: string, input: any) => {
  const createRemoteConversationPayload = CreateRemoteConversationPayload.parse({
    type: 'createRemoteConversation',
    payload: { ...input },
  })
  const response = await axios.post(`${endpointBaseUrl}/createRemoteConversation`, createRemoteConversationPayload)
  return CreateRemoteConversationResponse.parse(response.data)
}

/**
 * @swagger
 * /closeRemoteTicket:
 *   post:
 *     summary: Close a ticket
 *     tags:
 *      - Endpoints to implement
 *     description: Closes a ticket on your service. Once closed, no further actions are expected for this conversation. Your service must return a 200 response.
 *     operationId: closeRemoteTicket
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CloseRemoteTicketPayload'
 *     responses:
 *       200:
 *         description: Ticket closed successfully.
 */
export const closeRemoteTicket = async (endpointBaseUrl: string, botpressConversationId: string) => {
  const closeRemoteTicketPayload = CloseRemoteTicketPayload.parse({
    type: 'closeRemoteTicket',
    payload: { botpressConversationId },
  })
  const response = await axios.post(`${endpointBaseUrl}/closeRemoteTicket`, closeRemoteTicketPayload)
  return response.data
}

/**
 * @swagger
 * /createRemoteUser:
 *   post:
 *     summary: Create a user
 *     tags:
 *      - Endpoints to implement
 *     description: Creates a user on your service. This is necessary to associate users with conversations in the HITL process. Your service must return payload with an id for the conversation in the live agent system.
 *     operationId: createRemoteUser
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRemoteUserPayload'
 *     responses:
 *       200:
 *         description: User created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateRemoteUserResponse'
 */
export const createRemoteUser = async (endpointBaseUrl: string, input: any) => {
  const payload = {
    type: 'createRemoteUser',
    payload: { role: 'end-user', ...input },
  }
  const createRemoteUserPayload = CreateRemoteUserPayload.parse(payload)
  const response = await axios.post(`${endpointBaseUrl}/createRemoteUser`, createRemoteUserPayload)
  return CreateRemoteUserResponse.parse(response.data)
}

/**
 * @swagger
 * /botSendsMessage:
 *   post:
 *     summary: Send a message to the agent
 *     tags:
 *      - Endpoints to implement
 *     description: Sends a message from the bot to the agent conversation on your service as part of the HITL process. Your service must return a 200 response.
 *     operationId: botSendsMessage
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BotSendsMessagePayload'
 *     responses:
 *       200:
 *         description: Message sent successfully.
 */
export const botSendsMessage = async (
  endpointBaseUrl: string,
  conversationId: string,
  userId: string,
  payload: any
) => {
  const botSendsMessagePayload = BotSendsMessagePayload.parse({
    type: 'botSendsMessage',
    remoteConversationId: conversationId,
    remoteUserId: userId,
    payload,
  })
  const response = await axios.post(`${endpointBaseUrl}/botSendsMessage`, botSendsMessagePayload)

  return response.data
}
