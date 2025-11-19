import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'

interface ZoomConfig {
  clientId: string
  clientSecret: string
  accountId: string
}

interface AccessTokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface RecordingFile {
  file_type: string
  file_extension: string
  download_url?: string
}

interface RecordingsResponse {
  recording_files?: RecordingFile[]
}

export class ZoomApi {
  private config: ZoomConfig
  private logger: bp.Logger

  constructor(config: ZoomConfig, logger: bp.Logger) {
    this.config = config
    this.logger = logger
  }

  async getAccessToken(): Promise<string> {
    const { clientId, clientSecret, accountId } = this.config
    const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const json = (await res.json()) as AccessTokenResponse

    if (!res.ok || !json.access_token) {
      const errorMsg = `Zoom access token fetch failed (HTTP ${res.status}): ${json.error_description || json.error || 'Unknown error'}`
      this.logger.forBot().error(errorMsg, json)
      throw new RuntimeError(errorMsg)
    }

    return json.access_token
  }

  /**
   * Find transcript file URL with retries
   * Zoom may take time to generate the transcript, so we retry up to 3 times
   */
  async findTranscriptFile(meetingUUID: string, accessToken: string): Promise<string | null> {
    const encodedUUID = encodeURIComponent(meetingUUID)
    const maxRetries = 3
    const retryDelayMs = 20000

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const recRes = await fetch(`https://api.zoom.us/v2/meetings/${encodedUUID}/recordings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const recData = (await recRes.json()) as RecordingsResponse
      const files = recData.recording_files || []
      const transcriptFile = files.find((f) => f.file_type === 'TRANSCRIPT' && f.file_extension === 'VTT')

      if (transcriptFile?.download_url) {
        return transcriptFile.download_url
      }

      if (attempt < maxRetries) {
        await new Promise((res) => setTimeout(res, retryDelayMs))
      }
    }

    this.logger.forBot().warn(`Transcript file not found for meeting ${meetingUUID} after ${maxRetries} attempts`)
    return null
  }

  async fetchVttFile(url: string, accessToken: string): Promise<string> {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      throw new RuntimeError(`Failed to download VTT file: HTTP ${res.status}`)
    }

    return await res.text()
  }

  cleanVtt(vtt: string): string {
    return vtt
      .replace(/WEBVTT\n/g, '')
      .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> .*\n/g, '')
      .replace(/\n+/g, ' ')
      .trim()
  }
}

export const getZoomClient = (
  config: { zoomClientId: string; zoomClientSecret: string; zoomAccountId: string },
  logger: bp.Logger
): ZoomApi =>
  new ZoomApi(
    {
      clientId: config.zoomClientId,
      clientSecret: config.zoomClientSecret,
      accountId: config.zoomAccountId,
    },
    logger
  )
