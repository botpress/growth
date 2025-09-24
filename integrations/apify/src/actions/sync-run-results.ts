import { RuntimeError } from "@botpress/sdk";
import { getClient } from "../client";
import * as bp from '.botpress';

export const syncRunResults = async (props: bp.ActionProps['syncRunResults']) => {
  const { input, logger, ctx, client } = props;
  const { runId, kbId } = input;

  logger.forBot().info(`Syncing results for run ID: ${runId} to KB: ${kbId}`);

  try {
    const apifyClient = getClient(
      ctx.configuration.apiToken,
      client,
      logger
    );

    const runDetails = await apifyClient.getRunDetails(runId);
    
    if (runDetails.status !== 'SUCCEEDED') {
      logger.forBot().error(`Run is not completed. Current status: ${runDetails.status}`);
      throw new RuntimeError(`Run is not completed. Current status: ${runDetails.status}`);
    }

    if (!runDetails.datasetId) {
      logger.forBot().error('No dataset ID found for completed run');
      throw new RuntimeError('No dataset ID found for completed run');
    }

    const items = await apifyClient.fetchDatasetItems(runDetails.datasetId);
    
    const filesCreated = await apifyClient.syncContentToBotpress(items, kbId);

    logger.forBot().info(`Sync completed. Items: ${items.length}, Files created: ${filesCreated}`);

    return {
      success: true,
      message: `Run results synced successfully. Items: ${items.length}, Files created: ${filesCreated}`,
      data: {
        runId: runDetails.runId,
        datasetId: runDetails.datasetId,
        itemsCount: items.length,
        filesCreated,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.forBot().error(`Sync run results exception: ${errorMessage}`);
    throw new RuntimeError(`Apify API Error: ${errorMessage}`);
  }
}; 