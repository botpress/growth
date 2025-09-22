import { getClient } from "../client";
import * as bp from '.botpress';

export const getRunStatus = async ({ 
  ctx, 
  client,
  input,
  logger
}: {
  ctx: bp.Context;
  client: bp.Client;
  input: { runId: string };
  logger: bp.Logger;
}) => {
  const { runId } = input;
  
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

  logger.forBot().info(`Checking status for run ID: ${runId}`);

  try {
    const apifyClient = getClient(
      ctx.configuration.apiToken,
      client,
      logger
    );

    const result = await apifyClient.getRunStatus(runId);

    if (result.success) {
      logger.forBot().info(`Run status retrieved. Status: ${result.data?.status}`);
      logger.forBot().debug(`Status result: ${JSON.stringify(result.data)}`);
      
      return {
        success: true,
        message: `Run status retrieved successfully. Current status: ${result.data?.status}`,
        data: result.data,
      };
    } else {
      logger.forBot().error(`Failed to get run status: ${result.message}`);
      
      return {
        success: false,
        message: result.message || 'Failed to get run status',
        data: result.data || { error: result.message },
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.forBot().error(`Get run status exception: ${errorMessage}`);

    return {
      success: false,
      message: `Failed to get run status: ${errorMessage}`,
      data: {
        error: errorMessage,
      },
    };
  }
}; 