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
  const startTime = Date.now()
  const startTimeISO = new Date().toISOString()
  const runId = webhookPayload.resource.id
  
  try {

    if (!runId) {
      logger.forBot().error('No run ID found in webhook payload')
      return
    }

    logger.forBot().info(`[TIMING] Webhook started at ${startTimeISO} for run ${runId}`)
    logger.forBot().info(`Crawler run ${runId} completed successfully, processing results...`)

    const apifyClient = getClient(
      ctx.configuration.apiToken,
      client,
      logger,
      ctx.integrationId,
      ctx
    )

    // check if this is a continuation sync
    let continuationState
    try {
      continuationState = await client.getState({ 
        type: 'integration', 
        id: ctx.integrationId, 
        name: 'syncContinuation' 
      })
    } catch (error) {
      logger.forBot().warn(`syncContinuation state not available, treating as new sync: ${error}`)
      continuationState = null
    }
    
    let kbId: string
    let startOffset = 0
    
    if (continuationState?.state?.payload?.runId === runId) {
      const continuation = continuationState.state.payload
      kbId = continuation.kbId
      startOffset = continuation.nextOffset
      logger.forBot().info(`[CONTINUATION] Continuing sync for run ${runId} from offset ${startOffset}`)
      
      try {
        await client.setState({
          type: 'integration',
          id: ctx.integrationId,
          name: 'syncContinuation',
          payload: null
        })
      } catch (error) {
        logger.forBot().warn(`Could not clear syncContinuation state: ${error}`)
      }
    } else {
      const mapping = await client.getState({ type: 'integration', id: ctx.integrationId, name: 'apifyRunMappings' })
      const mapPayload = mapping?.state?.payload
      const mappedKbId = mapPayload?.[runId]
      
      if (!mappedKbId) {
        logger.forBot().error(`No kbId mapping found for run ${runId}. This should not happen.`)
        return
      }
      
      kbId = mappedKbId
      logger.forBot().info(`Found kbId mapping for run ${runId}: ${kbId}`)
    }

    logger.forBot().info(`Will index results directly into KB: ${kbId}`)
  
    const runDetails = await apifyClient.getRun(runId)
    
    // fetch and sync items one by one with time limit (50 seconds) and start offset
    const streamingResult = await apifyClient.fetchAndSyncStreaming(runDetails.datasetId!, kbId, 50000, startOffset)

    const resultsResult = {
      success: true,
      message: `Run results synced successfully. Items: ${streamingResult.itemsProcessed}, Files created: ${streamingResult.filesCreated}`,
      data: {
        runId: runDetails.runId,
        datasetId: runDetails.datasetId,
        itemsCount: streamingResult.itemsProcessed,
        filesCreated: streamingResult.filesCreated,
        hasMore: streamingResult.hasMore,
        nextOffset: streamingResult.nextOffset,
      },
    }

    if (resultsResult.success) {
      logger.forBot().info(`Successfully processed results for run ${runId}. Items: ${resultsResult.data?.itemsCount}, Files created: ${resultsResult.data?.filesCreated}`)
      
      // more data to sync, trigger continuation webhook
      if (streamingResult.hasMore === true && streamingResult.nextOffset > 0) {
        logger.forBot().info(`[CONTINUATION] More data available, triggering continuation webhook for run ${runId}`)
        await apifyClient.triggerContinuationWebhook(runId, kbId, streamingResult.nextOffset)
      } else {
        logger.forBot().info(`[SYNC] All data synced for run ${runId} - NOT triggering webhook (hasMore: ${streamingResult.hasMore}, nextOffset: ${streamingResult.nextOffset})`)
      }
      
      await client.createEvent({
        type: 'crawlerCompleted',
        payload: {
          actorId: webhookPayload.eventData.actorId,
          actorRunId: webhookPayload.eventData.actorRunId,
          eventType: webhookPayload.eventType,
          runId: runId,
          itemsCount: resultsResult.data?.itemsCount,
          filesCreated: resultsResult.data?.filesCreated,
          hasMore: streamingResult.hasMore,
        },
      })
      
      logger.forBot().info(`Emitted crawlerCompleted event for run ${runId}`)
      
    } else {
      logger.forBot().error(`Failed to get results for run ${runId}: ${resultsResult.message}`)
      logger.forBot().error(`Error details:`, resultsResult.data)
    }

    const endTime = Date.now()
    const duration = endTime - startTime
    const endTimeISO = new Date().toISOString()
    logger.forBot().info(`[TIMING] Webhook completed at ${endTimeISO} for run ${runId} - Duration: ${duration}ms (${(duration/1000).toFixed(2)}s)`)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.forBot().error(`Crawler completion handler error: ${errorMessage}`)
    logger.forBot().error(`Full error:`, error)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    const endTimeISO = new Date().toISOString()
    logger.forBot().error(`[TIMING] Webhook failed at ${endTimeISO} for run ${runId} - Duration: ${duration}ms (${(duration/1000).toFixed(2)}s)`)
  }
}
