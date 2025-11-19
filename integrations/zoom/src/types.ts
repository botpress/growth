import { z } from '@botpress/sdk'

// Configuration types
export interface ZoomConfig {
  zoomClientId: string
  zoomClientSecret: string
  zoomAccountId: string
  secretToken: string
  allowedZoomUserIds: string[]
}

// Webhook schemas and types
export const transcriptCompletedSchema = z.object({
  event: z.literal('recording.transcript_completed'),
  payload: z.object({
    object: z.object({
      uuid: z.string(),
      host_id: z.string(),
    }),
  }),
})

export type TranscriptCompletedPayload = z.infer<typeof transcriptCompletedSchema>
