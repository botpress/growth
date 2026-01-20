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

const authResponseSchema = z.object({
  data: z.object({
    result: z
      .object({
        uid: z.number().describe('The UID of the user'),
      })
      .optional(),
    error: z
      .object({
        code: z.number().describe('The error code'),
        message: z.string().describe('The error message'),
      })
      .optional(),
  }),
  headers: z.object({
    'set-cookie': z
      .union([z.string(), z.array(z.string())])
      .optional()
      .describe('The set-cookie header from the Odoo API response.'),
  }),
})

const cookieSchema = z.object({
  cookie: z.string().describe('The cookie to use for the Odoo API'),
  timestamp: z.number().describe('The timestamp of the cookie'),
})

export type AuthPayloadBody = z.infer<typeof authPayloadBodySchema>
export type AuthHeaders = z.infer<typeof authHeadersSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type Cookie = z.infer<typeof cookieSchema>
