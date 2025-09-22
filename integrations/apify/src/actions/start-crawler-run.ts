import * as bp from '.botpress';
import { getClient } from 'src/client';
 
export const startCrawlerRun = async ({ 
  ctx, 
  client,
  input, 
  logger
}: {
  ctx: bp.Context;
  client: bp.Client;
  input: { startUrls: string[]; excludeUrlGlobs?: string[]; includeUrlGlobs?: string[]; 
    maxCrawlPages?: number; kbId?: string; saveMarkdown?: boolean; 
    htmlTransformer?: 'readableTextIfPossible' | 'readableText' | 'minimal' | 'none'; 
    removeElementsCssSelector?: string; 
    crawlerType?: 'playwright:adaptive' | 'playwright:firefox' | 'cheerio' | 'jsdom' | 'playwright:chrome'; 
    expandClickableElements?: boolean; headers?: Record<string, string>; rawInputJsonOverride?: string; };
  logger: bp.Logger;
}) => {
  logger.forBot().info(`Starting crawler run with input: ${JSON.stringify(input)}`);

  try {
    const apifyClient = getClient(
      ctx.configuration.apiToken,
      client,
      logger
    );

    const params = {
      startUrls: input.startUrls,
      excludeUrlGlobs: input.excludeUrlGlobs,
      includeUrlGlobs: input.includeUrlGlobs,
      maxCrawlPages: input.maxCrawlPages,
      saveMarkdown: input.saveMarkdown,
      htmlTransformer: input.htmlTransformer,
      removeElementsCssSelector: input.removeElementsCssSelector,
      crawlerType: input.crawlerType,
      expandClickableElements: input.expandClickableElements,
      headers: input.headers,
      rawInputJsonOverride: input.rawInputJsonOverride,
      kbId: input.kbId,
    } as const;

    const result = await apifyClient.startCrawlerRun(params);

    if (result.success) {
      logger.forBot().info(`Crawler run started successfully. Run ID: ${result.data?.runId}`);
      logger.forBot().debug(`Start result: ${JSON.stringify(result.data)}`);

      const kbId = input?.kbId;
      const runId = result?.data?.runId;
      if (kbId && runId) {
        try {
          logger.forBot().info(`Persisting kbId mapping for run ${runId} -> kb ${kbId}`);
          const existing = await client.getState({
            type: 'integration',
            id: ctx.integrationId,
            name: 'apifyRunMappings',
          });

          const payload = existing?.state?.payload;
          const currentMap = payload || {};
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

      return {
        success: true,
        message: `Crawler run started successfully. Run ID: ${result.data?.runId}`,
        data: result.data,
      };
    } else {
      logger.forBot().error(`Failed to start crawler run: ${result.message}`);
      
      return {
        success: false,
        message: result.message || 'Failed to start crawler run',
        data: result.data || { error: result.message },
      };
    }
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