import { RuntimeError } from '@botpress/sdk'
import { getAccessToken, findTranscriptFile, fetchVttFile, cleanVtt } from './zoom'
import crypto from 'crypto'
import * as bp from '.botpress'

const integration = new bp.Integration({
  handler: async (args) => {
    const { req, ctx, client } = args

    const config = ctx.configuration as unknown as {
      zoomClientId: string
      zoomClientSecret: string
      zoomAccountId: string
      verificationToken: string
      allowedZoomUserIds: string[]
    }

    let body: any = {}

    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    } catch {
      body = req.body
    }

    // Handle Zoom URL Validation handshake
    if (body?.event === 'endpoint.url_validation') {
      const plainToken = body.payload?.plainToken
      const secret = config.verificationToken

      if (!plainToken || !secret) {
        return { status: 400, body: 'Missing plainToken or verificationToken' }
      }

      const encryptedToken = crypto
        .createHmac('sha256', secret)
        .update(plainToken)
        .digest('hex')

      return {
        status: 200,
        body: JSON.stringify({ plainToken, encryptedToken }),
        headers: { 'Content-Type': 'application/json' },
      }
    }

    // Only process transcript completion events
    if (body?.event === 'recording.transcript_completed') {
      try {
        // Step 1: Filter by allowed user IDs (host_id)
        const allowedUserIds = config.allowedZoomUserIds
        const hostId = body?.payload?.object?.host_id

        if (
          Array.isArray(allowedUserIds) &&
          allowedUserIds.length > 0 &&
          !allowedUserIds.includes(hostId)
        ) {
          console.log(`Ignoring event: host_id (${hostId}) is not in allowed list (${allowedUserIds.join(', ')})`)
          return { status: 200, body: 'Event ignored: userId not allowed' }
        }

        // Step 2: Auth with Zoom
        const accessToken = await getAccessToken({
          clientId: config.zoomClientId,
          clientSecret: config.zoomClientSecret,
          accountId: config.zoomAccountId,
        })

        // Step 3: Extract meeting UUID
        const meetingUUID = body?.payload?.object?.uuid
        if (!meetingUUID) throw new RuntimeError('Missing meeting UUID from Zoom payload')

        // Step 4: Get transcript file URL (with retry)
        const downloadUrl = await findTranscriptFile(meetingUUID, accessToken)
        if (!downloadUrl) throw new RuntimeError('Transcript file not found after retries')

        // Step 5: Download and clean VTT
        const vttText = await fetchVttFile(downloadUrl, accessToken)
        const plainText = cleanVtt(vttText)

        // Step 6: Emit event to Botpress
        await client.createEvent({
          type: 'transcriptReceived',
          payload: {
            meetingUUID,
            transcript: plainText,
            rawVtt: vttText,
          },
        })

        return { status: 200, body: 'Transcript processed.' }
      } catch (err: any) {
        return { status: 500, body: `Zoom handler error: ${err.message}` }
      }
    }

    // Ignore other event types
    return { status: 200, body: 'Event ignored.' }
  },
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {},
})

export default integration
