import { getClient } from '../client'
import { apifyWebhookSchema } from '../misc/schemas'
import * as bp from '.botpress'
import type { z } from 'zod'
import { RuntimeError } from '@botpress/sdk'

type ApifyWebhook = z.infer<typeof apifyWebhookSchema>

export async function handleCrawlerCompleted({ webhookPayload, client, logger, ctx }: { 
  webhookPayload: ApifyWebhook, 
  client: bp.Client, 
  logger: bp.Logger, 
  ctx: bp.Context 
}) {
  const runId = webhookPayload.resource.id
  
  try {

    if (!runId) {
      logger.forBot().error('No run ID found in webhook payload')
      return
    }
    // webhook received for completed run

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
      continuationState = null
    }
    
    let kbId: string
    let startOffset = 0
    
    if (continuationState?.state?.payload?.runId === runId) {
      const continuation = continuationState.state.payload
      kbId = continuation.kbId
      startOffset = continuation.nextOffset
      logger.forBot().info(`▶ Continuation from offset ${startOffset}`)
      
      try {
        await client.setState({
          type: 'integration',
          id: ctx.integrationId,
          name: 'syncContinuation',
          payload: null
        })
      } catch (error) {
        // Ignore state clear errors
      }
    } else {
      // Fetch run mapping with timeout handling
      let mapping
      try {
        mapping = await client.getState({ 
          type: 'integration', 
          id: ctx.integrationId, 
          name: 'apifyRunMappings' 
        })
      } catch (error) {
        logger.forBot().error(`Failed to fetch run mapping for ${runId}: ${error}`)
        logger.forBot().error(`Webhook will be retried by Apify`)
        throw new RuntimeError('Failed to fetch run mapping') 
      }
      
      const mapPayload = mapping?.state?.payload
      const mappedKbId = mapPayload?.[runId]
      
      if (!mappedKbId) {
        logger.forBot().error(`No kbId mapping found for run ${runId}. This should not happen.`)
        return
      }
      
      kbId = mappedKbId
      logger.forBot().info(`▶ Starting sync: ${runId}`)
    }
  
    const runDetails = await apifyClient.getRun(runId)
    
    // fetch and sync items one by one without timeout for testing
    const streamingResult = await apifyClient.fetchAndSyncStreaming(runDetails.datasetId!, kbId, 0, startOffset)

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
      const total = streamingResult.total || 0;
      const progress = streamingResult.nextOffset || total;
      
      if (streamingResult.hasMore === true && streamingResult.nextOffset > 0) {
        logger.forBot().info(`✓ Batch: ${resultsResult.data?.itemsCount} items → ${resultsResult.data?.filesCreated} files (${progress}/${total})`);
        try {
          await apifyClient.triggerSyncWebhook(runId, kbId, streamingResult.nextOffset)
        } catch (error) {
          logger.forBot().error(`Failed to trigger continuation: ${error}`)
        }
      } else {
        logger.forBot().info(`✓ Complete: ${total} items → ${resultsResult.data?.filesCreated} files`);
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
