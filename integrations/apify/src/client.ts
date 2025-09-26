import { ApifyClient, ApifyApiError } from 'apify-client';
import * as bp from '.botpress';
import { CrawlerRunInput, DatasetItem, ApifyDataset } from './misc/types';
import { Utils } from './helpers/utils';

export class ApifyApi {
  private client: ApifyClient;
  private bpClient: bp.Client;
  private logger: bp.Logger;
  private utils: Utils;
  private integrationId: string;
  private ctx: bp.Context;

  constructor(apiToken: string, bpClient: bp.Client, logger: bp.Logger, integrationId: string, ctx: bp.Context) {
    this.client = new ApifyClient({
      token: apiToken,
      maxRetries: 8,
      minDelayBetweenRetriesMillis: 500,
      timeoutSecs: 360, // 6 minutes timeout
    });
    this.bpClient = bpClient;
    this.logger = logger;
    this.integrationId = integrationId;
    this.ctx = ctx;
    this.utils = new Utils(bpClient, logger);
  }

  /**
   * Starts a crawler run asynchronously and returns the run ID
   * Use this with webhooks for production crawling
   */
    async startCrawlerRun(input: CrawlerRunInput): Promise<{ runId: string; status: string }> {
    this.logger.forBot().info('Starting Apify Website Content Crawler with input:', JSON.stringify(input, null, 2));

    const run = await this.client.actor('apify/website-content-crawler').call(input, { waitSecs: 0 });

    this.logger.forBot().info(`Crawler run started with ID: ${run.id}`);

    return {
      runId: run.id,
      status: run.status,
    }
  }

  async getRun(runId: string): Promise<{ runId: string; status: string; datasetId?: string }> {
    this.logger.forBot().info(`Getting status for run ID: ${runId}`);

    try {
      const run = await this.client.run(runId).get();
      this.logger.forBot().info(`Run status retrieved. Status: ${run?.status}`);

      return {
        runId: run?.id || runId,
        status: run?.status || 'UNKNOWN',
        datasetId: run?.defaultDatasetId,
      }
    } catch (error) {
      this.logger.forBot().error(`Error in getRun: ${error}`);
      throw error;
    }
  }


  async fetchAndSyncStreaming(datasetId: string, kbId: string, timeLimitMs: number = 50000, startOffset: number = 0): Promise<{ itemsProcessed: number; hasMore: boolean; nextOffset: number; total: number; filesCreated: number }> {
    this.logger.forBot().info(`Starting streaming fetch & sync for dataset: ${datasetId} to KB: ${kbId} with time limit: ${timeLimitMs}ms, start offset: ${startOffset}`);

    const dataset = this.client.dataset(datasetId);
    const result = await this.utils.fetchAndSyncStreaming(dataset, kbId, this.syncContentToBotpress.bind(this), timeLimitMs, startOffset);
    
    this.logger.forBot().info(`Streaming completed: ${result.itemsProcessed} items processed, ${result.filesCreated} files created. Has more: ${result.hasMore}`);
    return result;
  }

  async syncContentToBotpress(items: DatasetItem[], kbId: string): Promise<number> {
    this.logger.forBot().info(`[FILE SYNC] Starting sync for ${items.length} items to KB ${kbId}`);
    let filesCreated = 0;

    for (const item of items) {
      try {
        const processedItem = this.utils.processItemContent(item);
        if (!processedItem) {
          this.logger.forBot().warn(`[FILE SYNC] Skipping item: No content found`);
          continue;
        }

        const filename = this.utils.generateFilename(item);
        const fullFilename = `${filename}.${processedItem.extension}`;

        await this.utils.uploadFileToBotpress(fullFilename, processedItem.content, processedItem.extension, kbId);
        filesCreated++;
      } catch (error) {
        this.logger.forBot().error(`[FILE SYNC] Error processing item:`, error);
      }
    }

    this.logger.forBot().info(`[FILE SYNC] File sync completed. Total files created: ${filesCreated}/${items.length}`);
    return filesCreated;
  }

  async triggerContinuationWebhook(runId: string, kbId: string, nextOffset: number): Promise<void> {
    this.logger.forBot().info(`[CONTINUATION] Triggering webhook to continue sync for run ${runId} from offset ${nextOffset}`);
    
    // webhook payload to trigger continuation
    const webhookPayload = {
      userId: 'synthetic-user',
      createdAt: new Date().toISOString(),
      eventType: 'ACTOR.RUN.SUCCEEDED',
      eventData: {
        actorId: 'apify/website-content-crawler',
        actorRunId: runId
      },
      resource: {
        id: runId,
        actId: 'apify/website-content-crawler',
        userId: 'synthetic-user',
        status: 'SUCCEEDED',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString()
      }
    };

    // store continuation state
    try {
      await this.bpClient.setState({
        type: 'integration',
        id: this.integrationId,
        name: 'syncContinuation',
        payload: {
          runId,
          kbId,
          nextOffset,
          timestamp: Date.now()
        }
      })
    } catch (error) {
      this.logger.forBot().warn(`Could not store syncContinuation state: ${error}`)
    };

    // trigger the webhook handler
    const { handleApifyWebhook } = await import('./setup/handleApifyWebhook');
    await handleApifyWebhook({
      webhookPayload: webhookPayload,
      client: this.bpClient,
      logger: this.logger,
      ctx: this.ctx
    });

    this.logger.forBot().info(`[CONTINUATION] Webhook triggered for run ${runId}`);
  }

}

export const getClient = (
  apiToken: string,
  bpClient: bp.Client,
  logger: bp.Logger,
  integrationId: string,
  ctx: bp.Context
) => {
  return new ApifyApi(apiToken, bpClient, logger, integrationId, ctx);
};
