import crypto from 'crypto'
import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'
import { getZoomClient } from '../client'
import { transcriptCompletedSchema, TranscriptCompletedPayload, ZoomConfig } from '../types'

interface ZoomWebhookBody {
  event: string
  payload?: Record<string, unknown>
}

interface TranscriptCompletedArgs {
  payload: TranscriptCompletedPayload
  config: ZoomConfig
  client: bp.Client
  logger: bp.Logger
}

const handleTranscriptCompleted = async ({
  payload,
  config,
  client,
  logger,
}: TranscriptCompletedArgs): Promise<{ status: number; body: string }> => {
  try {
    // Step 1: Filter by allowed user IDs (host_id)
    const allowedUserIds = config.allowedZoomUserIds
    const hostId = payload.payload.object.host_id

    if (allowedUserIds.length > 0 && !allowedUserIds.includes(hostId)) {
      return { status: 200, body: 'Event ignored: userId not allowed' }
    }

    // Step 2: Initialize Zoom API client
    const zoomClient = getZoomClient(config, logger)

    // Step 3: Get access token
    const accessToken = await zoomClient.getAccessToken()

    // Step 4: Extract meeting UUID
    const meetingUUID = payload.payload.object.uuid
    if (!meetingUUID) {
      throw new RuntimeError('Missing meeting UUID from Zoom payload')
    }

    // Step 5: Get transcript file URL (with retry)
    const downloadUrl = await zoomClient.findTranscriptFile(meetingUUID, accessToken)
    if (!downloadUrl) {
      throw new RuntimeError('Transcript file not found after retries')
    }

    // Step 6: Download and clean VTT
    const vttText = await zoomClient.fetchVttFile(downloadUrl, accessToken)
    const plainText = zoomClient.cleanVtt(vttText)

    // Step 7: Emit event to Botpress
    await client.createEvent({
      type: 'transcriptReceived',
      payload: {
        meetingUUID,
        hostId,
        transcript: plainText,
        rawVtt: vttText,
      },
    })

    logger.forBot().info(`Transcript processed successfully for meeting ${meetingUUID}`)
    return { status: 200, body: 'Transcript processed.' }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.forBot().error(`Transcript handler error: ${errorMsg}`)
    return { status: 500, body: `Zoom handler error: ${errorMsg}` }
  }
}

export const handler: bp.IntegrationProps['handler'] = async ({ req, ctx, client, logger }) => {
  const config = ctx.configuration as ZoomConfig

  let body: unknown

  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    logger.forBot().error('Invalid JSON in request body')
    return { status: 400, body: 'Invalid JSON in request body' }
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    logger.forBot().error('Invalid request body format')
    return { status: 400, body: 'Invalid request body format' }
  }

  const webhookBody = body as ZoomWebhookBody

  if (webhookBody.event === 'endpoint.url_validation') {
    const plainToken = webhookBody.payload?.plainToken
    const secret = config.secretToken

    if (!plainToken || !secret || typeof plainToken !== 'string') {
      logger.forBot().error('URL validation failed: Missing plainToken or secretToken')
      return { status: 400, body: 'Missing plainToken or verificationToken' }
    }

    const encryptedToken = crypto.createHmac('sha256', secret).update(plainToken).digest('hex')

    return {
      status: 200,
      body: JSON.stringify({ plainToken, encryptedToken }),
      headers: { 'Content-Type': 'application/json' },
    }
  }

  if (webhookBody.event === 'recording.transcript_completed') {
    const validation = transcriptCompletedSchema.safeParse(body)
    if (!validation.success) {
      logger.forBot().error(`Transcript event schema error: ${validation.error.message}`)
      return { status: 400, body: 'Invalid transcript completion payload' }
    }
    return await handleTranscriptCompleted({ payload: validation.data, config, client, logger })
  }

  return { status: 200, body: 'Event ignored.' }
}
