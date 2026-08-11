import { z } from '@botpress/sdk'

const authPayloadBodySchema = z.object({
  jsonrpc: z.literal('2.0'),
  params: z.object({
    db: z.string().describe('The Odoo database name (Case sensitive).'),
    login: z.string().describe('The Odoo email address.'),
    password: z.string().describe('The Odoo password.').secret(),
  }),
  id: z.number().describe('The ID of the request'),
})

const authHeadersSchema = z.object({
  'Content-Type': z.literal('application/json'),
})

/**
 * Schema for authentication response headers.
 * Used to type the headers from axios responses.
 */
const authResponseHeadersSchema = z.object({
  'set-cookie': z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('The set-cookie header from the Odoo API response.'),
})

const cookieSchema = z.object({
  cookie: z.string().describe('The cookie to use for the Odoo API'),
  timestamp: z.number().describe('The timestamp of the cookie'),
})

export const authResponseDataSchema = z.object({
  jsonrpc: z.literal('2.0'),
  result: z
    .object({
      uid: z.number(),
    })
    .optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
  id: z.number(),
})

export type AuthPayloadBody = z.infer<typeof authPayloadBodySchema>
export type AuthHeaders = z.infer<typeof authHeadersSchema>
export type AuthResponseHeaders = z.infer<typeof authResponseHeadersSchema>
export type Cookie = z.infer<typeof cookieSchema>
export type AuthResponseData = z.infer<typeof authResponseDataSchema>
