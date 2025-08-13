import { getClient } from "../client";

export const startCrawlerRun = async ({ 
  ctx, 
  client, 
  logger, 
  input 
}: any) => {
  logger.forBot().info(`Starting crawler run with input: ${JSON.stringify(input)}`);

  try {
    const apifyClient = getClient(
      ctx.configuration.apiToken,
      client,
      logger
    );

    const result = await apifyClient.startCrawlerRun(input);

    if (result.success) {
      logger.forBot().info(`Crawler run started successfully. Run ID: ${result.data?.runId}`);
      logger.forBot().debug(`Start result: ${JSON.stringify(result.data)}`);
    } else {
      logger.forBot().error(`Failed to start crawler run: ${result.message}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.forBot().error(`Start crawler run exception: ${errorMessage}`);

    return {
      success: false,
      message: errorMessage,
      data: {
        error: errorMessage,
      },
    };
  }
}; 