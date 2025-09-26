import { RuntimeError } from "@botpress/sdk";
import { getClient } from "../client";
import * as bp from '.botpress';

export const syncRunResults = async (props: bp.ActionProps['syncRunResults']) => {
  const { input, logger, ctx, client } = props;
  const { runId, kbId } = input;

  logger.forBot().info(`Syncing results for run ID: ${runId} to KB: ${kbId}`);

  if (!runId || runId === '') {
    const errorMessage = 'Run ID is required';
    logger.forBot().error(errorMessage);
    throw new RuntimeError(errorMessage);
  }

  if (!kbId || kbId === '') {
    const errorMessage = 'Knowledge Base ID (kbId) is required';
    logger.forBot().error(errorMessage);
    throw new RuntimeError(errorMessage);
  }

  try {
    const apifyClient = getClient(
      ctx.configuration.apiToken,
      client,
      logger,
      ctx.integrationId,
      ctx
    );

    const runDetails = await apifyClient.getRun(runId);
    
    if (runDetails.status === 'UNKNOWN' && runDetails.runId === runId) {
      const errorMessage = `Run with ID ${runId} not found`;
      logger.forBot().error(errorMessage);
      throw new RuntimeError(errorMessage);
    }
    
    if (runDetails.status !== 'SUCCEEDED') {
      logger.forBot().error(`Run is not completed. Current status: ${runDetails.status}`);
      throw new RuntimeError(`Run is not completed. Current status: ${runDetails.status}`);
    }

    if (!runDetails.datasetId) {
      logger.forBot().error('No dataset ID found for completed run');
      throw new RuntimeError('No dataset ID found for completed run');
    }

    const streamingResult = await apifyClient.fetchAndSyncStreaming(runDetails.datasetId, kbId, 50000, 0);

    logger.forBot().info(`Sync completed. Items: ${streamingResult.itemsProcessed}, Files created: ${streamingResult.filesCreated}`);

    // more data to sync, trigger continuation webhook
    if (streamingResult.hasMore === true && streamingResult.nextOffset > 0) {
      logger.forBot().info(`[CONTINUATION] More data available, triggering continuation webhook for run ${runDetails.runId}`);
      await apifyClient.triggerContinuationWebhook(runDetails.runId, kbId, streamingResult.nextOffset);
    } else {
      logger.forBot().info(`[SYNC] All data synced for run ${runDetails.runId} - NOT triggering webhook (hasMore: ${streamingResult.hasMore}, nextOffset: ${streamingResult.nextOffset})`);
    }

    return {
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
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.forBot().error(`Sync run results exception: ${errorMessage}`);
    throw new RuntimeError(`Apify API Error: ${errorMessage}`);
  }
}; 