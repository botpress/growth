import { z, IntegrationDefinition } from '@botpress/sdk'
import hitl from './bp_modules/hitl'

export default new IntegrationDefinition({
  name: 'chatwoot',
  title: 'ChatWoot',
  description: 'Connect your Botpress bot to ChatWoot with HITL support',
  version: '0.2.0',
  readme: 'hub.md',
  icon: 'icon.svg',

  configuration: {
    schema: z.object({
      apiAccessToken: z.string().min(1).describe('Your ChatWoot API access token'),
      inboxId: z.string().min(1).describe('ChatWoot Inbox ID for HITL conversations'),
    }),
  },

  events: {
    hitlStarted: {
      title: 'HITL Started',
      description: 'Triggered when a HITL session started',
      schema: z.object({
        userId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        conversationId: z.string(),
      }),
    },
  },

  states: {
    integration: {
      type: 'integration',
      schema: z.object({
        accountId: z.string(),
      }),
    },
    userInfo: {
      type: 'user',
      schema: z.object({
        email: z.string(),
        chatwootContactId: z.string(),
      }),
    },
    chatwootContact: {
      type: 'conversation',
      schema: z.object({
        chatwootContactId: z.string(),
      }),
    },
  },

  channels: {
    hitl: {
      conversation: {
        tags: {
          id: { title: 'Chatwoot Conversation ID', description: 'The ID of the conversation in Chatwoot' },
          odId: { title: 'User ID', description: 'The Botpress user ID' },
        },
      },
      messages: {
        text: {
          schema: z.object({
            text: z.string(),
          }),
        },
        image: {
          schema: z.object({
            imageUrl: z.string(),
          }),
        },
        file: {
          schema: z.object({
            fileUrl: z.string(),
          }),
        },
        video: {
          schema: z.object({
            videoUrl: z.string(),
          }),
        },
      },
      message: {
        tags: {
          id: {},
          conversationId: {},
        },
      },
    },
  },

  user: {
    tags: {
      id: { title: 'User ID' },
      name: { title: 'User Name' },
      email: { title: 'User Email' },
      chatwootContactId: { title: 'Chatwoot Contact ID' },
      chatwootAgentId: { title: 'Chatwoot Agent ID' },
    },
  },

  entities: {
    ticket: {
      title: 'Ticket',
      description: 'A HITL ticket/session',
      schema: z.object({}),
    },
  },
}).extend(hitl, (self) => ({
  entities: {
    hitlSession: self.entities.ticket,
  },
  channels: {
    hitl: {
      title: 'Chatwoot HITL',
      description: 'Chatwoot HITL channel for human handoff',
    },
  },
}))
