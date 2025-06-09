import { z } from 'zod';

export const brevoMessageImageInfoSchema = z.object({
  width: z.number(),
  height: z.number(),
  previewUrl: z.string(),
});

export const brevoMessageFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  isAllowedFileType: z.boolean(),
  isImage: z.boolean(),
  isSticker: z.boolean(),
  link: z.string(),
  imageInfo: brevoMessageImageInfoSchema.optional(),
});

export const brevoMessageSchema = z.object({
  type: z.enum(['agent', 'visitor']),
  id: z.string(),
  text: z.string(),
  html: z.string(),
  createdAt: z.number(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  agentUserpic: z.string().nullable().optional(),
  isPushed: z.boolean().optional(),
  isTrigger: z.boolean().optional(),
  file: brevoMessageFileSchema.optional(),
  isMissed: z.boolean().optional(),
});

export const brevoAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  userpic: z.string().nullable().optional(),
});

export const brevoVisitorLastVisitPageSchema = z.object({
  link: z.string(),
  title: z.string(),
});

export const brevoVisitorLastVisitSchema = z.object({
  startedAt: z.number().optional(),
  finishedAt: z.number().nullable().optional(),
  hostName: z.string(),
  viewedPages: z.array(brevoVisitorLastVisitPageSchema),
});

export const brevoVisitorSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  threadLink: z.string(),
  source: z.string(),
  sourceChannelRef: z.string().nullable().optional(),
  sourceChannelLink: z.string().nullable().optional(),
  sourceConversationRef: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  color: z.string(),
  ip: z.string().nullable(),
  browserLanguage: z.string(),
  conversationLanguage: z.string(),
  browser: z.string(),
  os: z.string(),
  userAgent: z.string(),
  country: z.string(),
  city: z.string(),
  lastVisit: brevoVisitorLastVisitSchema.nullable().optional(),
  displayedName: z.string(),
  contactAttributes: z.record(z.any()).nullable().optional(),
  integrationAttributes: z.record(z.any()).nullable().optional(),
  attributes: z.record(z.any()).nullable().optional(),
  formattedAttributes: z.record(z.any()).nullable().optional(),
  notes: z.string().nullable().optional(),
  contactId: z.number().nullable().optional(),
  marketingConsent: z.boolean(),
  termsOfServiceConsent: z.boolean(),
  outsideConnections: z.record(z.any()).optional(),
});

export const brevoConversationStartPageSchema = z.object({
  link: z.string().optional(),
  title: z.string().optional(),
});

export const brevoConversationFragmentEventSchema = z.object({
  eventName: z.literal('conversationFragment'),
  conversationId: z.string(),
  messages: z.array(brevoMessageSchema),
  agents: z.array(brevoAgentSchema),
  visitor: brevoVisitorSchema,
  isNoAvailableAgent: z.boolean().optional(),
});

export const brevoConversationTranscriptEventSchema = z.object({
  eventName: z.literal('conversationTranscript'),
  conversationId: z.string(),
  conversationStartPage: brevoConversationStartPageSchema.optional(),
  messages: z.array(brevoMessageSchema),
  missedMessagesCount: z.number(),
  agents: z.array(brevoAgentSchema),
  visitor: brevoVisitorSchema,
});

// Union type for all possible event types
export const brevoEventSchema = z.discriminatedUnion('eventName', [
  brevoConversationFragmentEventSchema,
  brevoConversationTranscriptEventSchema,
]); 