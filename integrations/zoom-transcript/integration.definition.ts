import { z, IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'zoom-transcript',
  version: '1.0.6',
  title: 'Zoom Transcript',
  description: 'Receives Zoom webhook and processes transcript for meetings.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      zoomClientId: z.string().describe('Zoom Client ID'),
      zoomClientSecret: z.string().describe('Zoom Client Secret'),
      zoomAccountId: z.string().describe('Zoom Account ID'),
      verificationToken: z.string().describe('Zoom Webhook Secret for verification'),
      allowedZoomUserIds: z.array(z.string()).describe('Process events from these Zoom User IDs'),
    }),
  },

  events: {
    transcriptReceived: {
      schema: z.object({
        meetingUUID: z.string(),
        transcript: z.string(),
        rawVtt: z.string().optional(),
      }),
    },
  },
})
