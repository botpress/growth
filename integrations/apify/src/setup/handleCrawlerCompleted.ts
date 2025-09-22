import { getClient } from '../client'
import { apifyWebhookSchema } from '../misc/schemas'
import * as bp from '.botpress'
import type { z } from 'zod'

type ApifyWebhook = z.infer<typeof apifyWebhookSchema>

export async function handleCrawlerCompleted({ webhookPayload, client, logger, ctx }: { 
  webhookPayload: ApifyWebhook, 
  client: bp.Client, 
  logger: bp.Logger, 
  ctx: bp.Context 
}) {
  try {
    const runId = webhookPayload.resource.id

    if (!runId) {
      logger.forBot().error('No run ID found in webhook payload')
      return
    }

    logger.forBot().info(`Crawler run ${runId} completed successfully, processing results...`)

    const apifyClient = getClient(
      ctx.configuration.apiToken,
      client,
      logger
    )

    let kbId: string | undefined
    try {
      const mapping = await client.getState({ type: 'integration', id: ctx.integrationId, name: 'apifyRunMappings' })
      const mapPayload = mapping?.state?.payload
      kbId = mapPayload[runId]
      if (kbId) {
        logger.forBot().info(`Found kbId mapping for run ${runId}: ${kbId}`)
      } else {
        logger.forBot().info(`No kbId mapping found for run ${runId}. Will sync to files.`)
      }
    } catch (stateErr) {
      logger.forBot().warn(`Could not read kbId mapping for run ${runId}: ${stateErr instanceof Error ? stateErr.message : String(stateErr)}`)
    }

    const syncTargetPath = kbId ? undefined : `apify-results/${runId}`
    if (kbId) {
      logger.forBot().info(`Will index results directly into KB: ${kbId}`)
    } else {
      logger.forBot().info(`Will sync results to path: ${syncTargetPath}`)
    }

    logger.forBot().info(`Calling getRunResults with ${kbId ? `kbId: ${kbId}` : `syncTargetPath: ${syncTargetPath}`}`)
    const resultsResult = await apifyClient.getRunResults(runId, syncTargetPath, kbId)

    if (resultsResult.success) {
      logger.forBot().info(`Successfully processed results for run ${runId}. Items: ${resultsResult.data?.itemsCount}, Files created: ${resultsResult.data?.filesCreated}`)
      logger.forBot().debug(`Full results data:`, resultsResult.data)
      
      await client.createEvent({
        type: 'crawlerCompleted',
        payload: {
          actorId: webhookPayload.eventData.actorId,
          actorRunId: webhookPayload.eventData.actorRunId,
          eventType: webhookPayload.eventType,
          runId: runId,
          itemsCount: resultsResult.data?.itemsCount,
          filesCreated: resultsResult.data?.filesCreated,
          syncTargetPath: syncTargetPath,
        },
      })
      
      logger.forBot().info(`Emitted crawlerCompleted event for run ${runId}`)
      
    } else {
      logger.forBot().error(`Failed to get results for run ${runId}: ${resultsResult.message}`)
      logger.forBot().error(`Error details:`, resultsResult.data)
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.forBot().error(`Crawler completion handler error: ${errorMessage}`)
    logger.forBot().error(`Full error:`, error)
  }
}
