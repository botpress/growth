import { getClient } from "../client";
import * as bp from '.botpress';
import { RuntimeError } from '@botpress/sdk'

export const getRunStatus = async (props: bp.ActionProps['getRunStatus']) => {
  const { input, logger, ctx, client } = props;
  const { runId } = input;

  logger.forBot().info(`Checking status for run ID: ${runId}`);

  try {
    const apifyClient = getClient(
      ctx.configuration.apiToken,
      client,
      logger
    );

    const result = await apifyClient.getRunStatus(runId);
      
    return {
      success: true,
      message: `Run status retrieved successfully. Current status: ${result.status}`,
      data: result.status
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.forBot().error(`Get run status exception: ${errorMessage}`);
    throw new RuntimeError(`Failed to get run status: ${errorMessage}`);
  }
}; 