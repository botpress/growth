import { z } from 'zod'

// Schema for the incoming message from Genesys Open Message webhook
export const genesysInboundMessageSchema = z.object({
  id: z.string(),
  channel: z.object({
    from: z.object({
      id: z.string(),
      nickname: z.string().optional(),
      idType: z.enum(['Email', 'Opaque', 'Phone']),
    }),
    time: z.string(),
    messageId: z.string(),
  }),
  text: z.string().optional(),
  direction: z.enum(['Inbound', 'Outbound']).optional(),
})

// Schema for outbound message to Genesys
export const genesysOutboundMessageSchema = z.object({
  channel: z.object({
    from: z.object({
      id: z.string(),
      nickname: z.string().optional(),
      idType: z.enum(['Email', 'Opaque', 'Phone']),
    }),
    time: z.string(),
    messageId: z.string(),
  }),
  text: z.string(),
})

// Schema for OAuth2 token response
export const genesysTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
})
