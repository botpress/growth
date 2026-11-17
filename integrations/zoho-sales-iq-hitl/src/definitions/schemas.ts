import { z } from '@botpress/sdk'

export const CreateConversationResponseSchema = z.object({
  conversation_id: z.string(),
  channel_id: z.string(),
})

export type CreateConversationResponse = z.output<typeof CreateConversationResponseSchema>

// OAuth Token Response
export const OAuthTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in_sec: z.number(),
  api_domain: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
})
export type OAuthTokenResponse = z.infer<typeof OAuthTokenResponseSchema>

// Create Conversation Data (nested schemas)
const DepartmentSchema = z.object({
  name: z.string(),
  id: z.string(),
})

const ChatStatusSchema = z.object({
  state_key: z.string(),
  status_code: z.number(),
  state: z.number(),
  status_key: z.string(),
})

const VisitorSchema = z.object({
  name: z.string(),
  id: z.string(),
  country_code: z.string().optional(),
  supported_operations: z.array(z.string()).optional(),
  first_name: z.string(),
  ip: z.string().optional(),
  salutation: z.string(),
  email: z.string(),
  user_id: z.string(),
  last_name: z.string(),
})

export const CreateConversationDataSchema = z.object({
  id: z.string(),
  wms_chat_id: z.string(),
  unread_chats: z.boolean(),
  question: z.string(),
  department: DepartmentSchema,
  auto_assign: z.boolean(),
  last_modified_time: z.string(),
  start_time: z.string(),
  visitor: VisitorSchema,
  type: z.string(),
  chat_id: z.string(),
  chat_status: ChatStatusSchema,
  conversation_id: z.string(),
  reference_id: z.string(),
})
export type CreateConversationData = z.infer<typeof CreateConversationDataSchema>

// App Config (partial - only fields we validate)
export const AppConfigDataSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean(),
  })
  .passthrough()
export type AppConfigData = z.infer<typeof AppConfigDataSchema>

// Zoho API wraps responses in { url, object, data: {...} }
export const ZohoAppConfigResponseSchema = z.object({
  url: z.string(),
  object: z.string(),
  data: AppConfigDataSchema,
})
export type ZohoAppConfigResponse = z.infer<typeof ZohoAppConfigResponseSchema>

export const ZohoCreateConversationResponseSchema = z.object({
  url: z.string(),
  object: z.string(),
  data: CreateConversationDataSchema,
})
export type ZohoCreateConversationResponse = z.infer<typeof ZohoCreateConversationResponseSchema>

export type ZohoConfiguration = z.infer<typeof ZohoConfigurationSchema>

export const ZohoConfigurationSchema = z.object({
  clientId: z.string().describe('Your Zoho Client ID'),
  clientSecret: z.string().describe('Your Zoho Client Secret'),
  refreshToken: z.string().describe('Your Zoho Refresh Token'),
  screenName: z.string().describe('Your Zoho Screen Name'),
  appId: z.string().describe('To specify the portals app id of the brand.'),
  departmentId: z.string().describe('To specify the ID of the conversation initiated department.'),
  dataCenter: z.enum(['us', 'eu', 'in', 'au', 'cn', 'jp', 'ca']).describe('Zoho Data Center Region'),
})
