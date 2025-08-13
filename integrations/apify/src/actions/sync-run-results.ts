import { getClient } from "../client";

export const syncRunResults = async ({ 
  ctx, 
  client, 
  logger, 
  input 
}: any) => {
  const { runId, syncTargetPath } = input;
  
  if (!runId) {
    logger.forBot().error('Run ID is required');
    return {
      success: false,
      message: 'Run ID is required',
      data: {
        error: 'Run ID is required',
      },
    };
  }

  logger.forBot().info(`Getting results for run ID: ${runId}${syncTargetPath ? `, sync target: ${syncTargetPath}` : ''}`);

  try {
    const apifyClient = getClient(
      ctx.configuration.apiToken,
      client,
      logger
    );

    const result = await apifyClient.getRunResults(runId, syncTargetPath);

    if (result.success) {
      logger.forBot().info(`Run results retrieved successfully. Items: ${result.data?.itemsCount}, Files created: ${result.data?.filesCreated}`);
      logger.forBot().debug(`Results summary: ${JSON.stringify(result.data)}`);
    } else {
      logger.forBot().error(`Failed to get run results: ${result.message}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.forBot().error(`Get run results exception: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
      data: {
        error: errorMessage,
      },
    };
  }
}; 