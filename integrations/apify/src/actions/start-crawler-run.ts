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

      const kbId = input?.kbId as string | undefined;
      const runId = result?.data?.runId as string | undefined;
      if (kbId && runId) {
        try {
          logger.forBot().info(`Persisting kbId mapping for run ${runId} -> kb ${kbId}`);
          const existing = await client.getState({
            type: 'integration',
            id: ctx.integrationId,
            name: 'apifyRunMappings',
          }).catch(() => undefined as any);

          const currentMap = (existing?.state?.payload as Record<string, string> | undefined) ?? {};
          currentMap[runId] = kbId;

          await client.setState({
            type: 'integration',
            id: ctx.integrationId,
            name: 'apifyRunMappings',
            payload: currentMap,
          });

          logger.forBot().info(`Persisted kbId mapping for run ${runId}`);
        } catch (stateError) {
          logger.forBot().warn(`Failed to persist kbId mapping for run ${runId}: ${stateError instanceof Error ? stateError.message : String(stateError)}`);
        }
      }
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