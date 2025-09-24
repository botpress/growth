import { ApifyClient, ApifyApiError } from 'apify-client';
import * as bp from '.botpress';
import { CrawlerRunInput, DatasetItem, ApifyDataset } from './misc/types';
import { Utils } from './helpers/utils';

export class ApifyApi {
  private client: ApifyClient;
  private bpClient: bp.Client;
  private logger: bp.Logger;
  private utils: Utils;

  constructor(apiToken: string, bpClient: bp.Client, logger: bp.Logger) {
    this.client = new ApifyClient({
      token: apiToken,
      maxRetries: 8,
      minDelayBetweenRetriesMillis: 500,
      timeoutSecs: 360, // 6 minutes timeout
    });
    this.bpClient = bpClient;
    this.logger = logger;
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

  async fetchDatasetItems(datasetId: string): Promise<DatasetItem[]> {
    this.logger.forBot().info(`Fetching items from dataset: ${datasetId}`);

    const dataset = this.client.dataset(datasetId);
    const allItems = await this.utils.fetchAllDatasetItems(dataset);
    
    this.logger.forBot().info(`Retrieved ${allItems.length} total items from dataset`);
    return allItems;
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

}

export const getClient = (
  apiToken: string,
  bpClient: bp.Client,
  logger: bp.Logger
) => {
  return new ApifyApi(apiToken, bpClient, logger);
};
