import * as bp from '.botpress';
import { getClient } from 'src/client';
import { buildCrawlerInput } from 'src/misc/crawler-helpers';
import { RuntimeError } from '@botpress/sdk'

async function persistRunMapping(
  client: bp.Client, 
  ctx: bp.Context,
  runId: string, 
  kbId: string
) {
  const existing = await client.getState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'apifyRunMappings',
  });

  const payload = existing?.state?.payload;
  const currentMap = {...payload};

  currentMap[runId] = kbId;

  await client.setState({
    type: 'integration',
    id: ctx.integrationId,
    name: 'apifyRunMappings',
    payload: currentMap,
  });
}

export const startCrawlerRun = async (props: bp.ActionProps['startCrawlerRun']) => {
  const { input, logger, ctx, client } = props;
  logger.forBot().info(`Starting crawler run with input: ${JSON.stringify(input)}`);

  try {
    const apifyClient = getClient(
      ctx.configuration.apiToken,
      client,
      logger
    );

    const { kbId, ...apifyParams } = input;
    const crawlerInput = buildCrawlerInput(apifyParams);   
    
    if (apifyParams.headers && Object.keys(apifyParams.headers).length > 0) {
      crawlerInput.headers = apifyParams.headers;
    }

    const result = await apifyClient.startCrawlerRun(crawlerInput);

    logger.forBot().info(`Crawler run started successfully. Run ID: ${result.runId}`);
    logger.forBot().debug(`Start result: ${JSON.stringify(result)}`);

    const runId = result.runId;
    if (!runId) {
      logger.forBot().error('No run ID found in the response');
      throw new RuntimeError('Failed to start crawler run');
    }

    await persistRunMapping(client, ctx, runId, input.kbId);

    logger.forBot().info(`Persisted kbId mapping for run ${runId}`);

    return {
      success: true,
      message: `Crawler run started successfully. Run ID: ${result.runId}`,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.forBot().error(`Start crawler run exception: ${errorMessage}`);
    throw new RuntimeError(`Apify API Error: ${errorMessage}`);
  }
}; 