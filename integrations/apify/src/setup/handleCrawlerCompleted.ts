import { getClient } from '../client'
import { apifyWebhookSchema } from '../misc/schemas'
import { RuntimeError } from '@botpress/sdk'
import * as bp from '.botpress'
import type { z } from 'zod'

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
        const errorMsg = `No kbId mapping found for run ${runId}. Run may not have been started through this integration.`
        logger.forBot().error(errorMsg)
        throw new RuntimeError(errorMsg)
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
      const nextOffset = streamingResult.nextOffset || total;
      
      if (streamingResult.hasMore === true && streamingResult.nextOffset > 0) {
        logger.forBot().info(`✓ Batch: processed ${resultsResult.data?.itemsCount} items, created ${resultsResult.data?.filesCreated} files. Next offset: ${nextOffset}/${total}`);
        try {
          await apifyClient.triggerSyncWebhook(runId, kbId, streamingResult.nextOffset)
        } catch (error) {
          logger.forBot().error(`Failed to trigger continuation: ${error}`)
        }
      } else {
        logger.forBot().info(`✓ Complete: Total ${total} items in dataset, created ${resultsResult.data?.filesCreated} files in this batch`);
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
    throw new RuntimeError(errorMessage)
  }
}
