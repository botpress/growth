import * as sdk from '@botpress/sdk'

const messageSourceSchema = sdk.z.union([
  sdk.z.object({ type: sdk.z.literal('user'), userId: sdk.z.string() }),
  sdk.z.object({ type: sdk.z.literal('bot') }),
])

const messageSchema = sdk.z.object({
  source: messageSourceSchema,
  type: sdk.z.string(),
  payload: sdk.z.record(sdk.z.any()),
})

export default new sdk.InterfaceDefinition({
  name: 'hitl',
  version: '2.0.0',
  entities: {
    hitlSession: {
      title: 'HITL session',
      description: 'A HITL session, often referred to as a ticket or conversation in external systems',
      schema: sdk.z.object({}),
    },
  },
  events: {
    hitlAssigned: {
            schema: () =>
        sdk.z.object({
          // Also known as downstreamConversationId:
          conversationId: sdk.z
            .string()
            .title('HITL session ID')
            .describe('ID of the Botpress conversation representing the HITL session'),

          // Also known as humanAgentUserId:
          userId: sdk.z
            .string()
            .title('Human agent user ID')
            .describe('ID of the Botpress user representing the human agent assigned to the HITL session'),
        }),
    },
    hitlStopped: {
            schema: () =>
        sdk.z.object({
          // Also known as downstreamConversationId:
          conversationId: sdk.z
            .string()
            .title('HITL session ID')
            .describe('ID of the Botpress conversation representing the HITL session'),
        }),
    },
  },
  actions: {
    // TODO: allow for an interface to extend 'proactiveUser' and reuse its actions
    createUser: {
            title: 'Create external user', // <= this is a downstream user
      description: 'Create an end user in the external service and in Botpress',
      input: {
        schema: () =>
          sdk.z.object({
            name: sdk.z.string().title('Display name').describe('Display name of the end user'),
            pictureUrl: sdk.z.string().title('Picture URL').describe("URL of the end user's avatar").optional(),
            email: sdk.z.string().title('Email address').describe('Email address of the end user').optional(),
          }),
      },
      output: {
        schema: () =>
          sdk.z.object({
            userId: sdk.z
              .string()
              .title('Botpress user ID')
              .describe('ID of the Botpress user representing the end user'),
          }),
      },
    },
    startHitl: {
            title: 'Start new HITL session', // <= this is a downstream conversation / ticket
      description: 'Create a new HITL session in the external service and in Botpress',
      input: {
        schema: (entities) =>
          sdk.z.object({
            // Also known as downstreamUserId:
            userId: sdk.z.string().title('User ID').describe('ID of the Botpress user representing the end user'),

            // Ticket title:
            title: sdk.z
              .string()
              .title('Title')
              .describe('Title of the HITL session. This corresponds to a ticket title in systems that use tickets.')
              .optional(),

            // Ticket description:
            description: sdk.z
              .string()
              .title('Description')
              .describe(
                'Description of the HITL session. This corresponds to a ticket description in systems that use tickets.'
              )
              .optional(),

            hitlSession: entities.hitlSession
              .optional()
              .title('Extra configuration')
              .describe('Configuration of the HITL session'),

            // All messages sent prior to HITL session creation:
            messageHistory: sdk.z
              .array(messageSchema)
              .title('Conversation history')
              .describe(
                'History of all messages in the conversation up to this point. Should be displayed to the human agent in the external service.'
              ),
          }),
      },
      output: {
        schema: () =>
          sdk.z.object({
            // Also known as downstreamConversationId:
            conversationId: sdk.z
              .string()
              .title('HITL session ID')
              .describe('ID of the Botpress conversation representing the HITL session'),
          }),
      },
    },
    stopHitl: {
            title: 'Stop HITL session',
      description: 'Stop an existing HITL session in the external service',
      input: {
        schema: () =>
          sdk.z.object({
            // Also known as downstreamConversationId:
            conversationId: sdk.z
              .string()
              .title('HITL session ID')
              .describe('ID of the Botpress conversation representing the HITL session'),
          }),
      },
      output: {
        schema: () => sdk.z.object({}),
      },
    },
  },
  channels: {
    hitl: {
      messages: {
        text: {
          schema: () => sdk.z.object({
            text: sdk.z.string(),
            userId: sdk.z.string().optional().describe('Allows sending a message pretending to be a certain user'),
          }),
        },
        image: {
          schema: () => sdk.z.object({
            imageUrl: sdk.z.string(),
            userId: sdk.z.string().optional(),
          }),
        },
        audio: {
          schema: () => sdk.z.object({
            audioUrl: sdk.z.string(),
            userId: sdk.z.string().optional(),
          }),
        },
        video: {
          schema: () => sdk.z.object({
            videoUrl: sdk.z.string(),
            userId: sdk.z.string().optional(),
          }),
        },
        file: {
          schema: () => sdk.z.object({
            fileUrl: sdk.z.string(),
            title: sdk.z.string().optional(),
            userId: sdk.z.string().optional(),
          }),
        },
        bloc: {
          schema: () => sdk.z.object({
            items: sdk.z.array(sdk.z.object({
              type: sdk.z.string(),
              payload: sdk.z.record(sdk.z.any()),
            })),
            userId: sdk.z.string().optional(),
          }),
        },
      },
    },
  },
})
