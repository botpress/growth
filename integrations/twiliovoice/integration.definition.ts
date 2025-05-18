import { IntegrationDefinition, messages, z } from '@botpress/sdk';
import { integrationName } from './package.json';

export default new IntegrationDefinition({
  name: integrationName,
  title: 'Twilio Voice',
  description:
    'The Twilio Voice integration facilitates seamless voice communication between your AI-powered chatbot and Twilio',
  version: '0.2.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      accountSID: z.string(),
      authToken: z.string(),
      repromptPhrase: z.string().describe(`Phrase played if the caller doesn't respond`).optional(),
      voice: z.string().describe(`Default: Google.en-US-Standard-C`).optional(),
      language: z.string().describe(`Default: en-US`).optional(),
      timeOut: z.number().positive().describe(`Default: 1`).optional(),
      speechTimeOut: z.number().positive().describe(`Default: 1`).optional(),
    }),
  },
  channels: {
    channel: {
      messages: { text: messages.defaults.text },
      message: { tags: { id: {} } },
      conversation: {
        tags: { callSid: {} },
      },
    },
  },
  user: {
    tags: {
      accountSid: {},
    },
  },
});
