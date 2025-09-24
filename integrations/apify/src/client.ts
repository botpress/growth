import { ApifyClient, ApifyApiError } from 'apify-client';
import * as bp from '.botpress';
import { CrawlerRunInput, DatasetItem, ApifyDataset } from './misc/types';

export class ApifyApi {
  private client: ApifyClient;
  private bpClient: bp.Client;
  private logger: bp.Logger;

  constructor(apiToken: string, bpClient: bp.Client, logger: bp.Logger) {
    this.client = new ApifyClient({
      token: apiToken,
      maxRetries: 8,
      minDelayBetweenRetriesMillis: 500,
      timeoutSecs: 360, // 6 minutes timeout
    });
    this.bpClient = bpClient;
    this.logger = logger;
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

  async getRunStatus(runId: string): Promise<{ runId: string; status: string }> {
    this.logger.forBot().info(`Getting status for run ID: ${runId}`);

    const run = await this.client.run(runId).get();

    this.logger.forBot().info(`Run status retrieved. Status: ${run?.status}`);

    return {
      runId: run?.id || runId,
      status: run?.status || 'UNKNOWN',
    }
  }

  async getRunDetails(runId: string): Promise<{ runId: string; status: string; datasetId?: string }> {
    this.logger.forBot().info(`Getting run details for ID: ${runId}`);

    const run = await this.client.run(runId).get();

    this.logger.forBot().info(`Run details retrieved. Status: ${run?.status}`);

    return {
      runId: run?.id || runId,
      status: run?.status || 'UNKNOWN',
      datasetId: run?.defaultDatasetId,
    };
  }

  async fetchDatasetItems(datasetId: string): Promise<DatasetItem[]> {
    this.logger.forBot().info(`Fetching items from dataset: ${datasetId}`);

    const dataset = this.client.dataset(datasetId);
    const allItems = await this.fetchAllDatasetItems(dataset);
    
    this.logger.forBot().info(`Retrieved ${allItems.length} total items from dataset`);
    return allItems;
  }

  async syncContentToBotpress(items: DatasetItem[], kbId: string): Promise<number> {
    this.logger.forBot().info(`[FILE SYNC] Starting sync for ${items.length} items to KB ${kbId}`);
    let filesCreated = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item) {
        this.logger.forBot().warn(`[FILE SYNC] Skipping item ${i}: Item is undefined`);
        continue;
      }

      try {
        const processedItem = this.processItemContent(item, i);
        if (!processedItem) {
          this.logger.forBot().warn(`[FILE SYNC] Skipping item ${i}: No content found`);
          continue;
        }

        const filename = this.generateFilename(item, i);
        const fullFilename = `${filename}.${processedItem.extension}`;

        await this.uploadFileToBotpress(fullFilename, processedItem.content, processedItem.extension, kbId);
        filesCreated++;
      } catch (error) {
        this.logger.forBot().error(`[FILE SYNC] Error processing item ${i}:`, error);
      }
    }

    this.logger.forBot().info(`[FILE SYNC] File sync completed. Total files created: ${filesCreated}/${items.length}`);
    return filesCreated;
  }

  private processItemContent(item: DatasetItem, index: number): { content: string; extension: string } | null {
    this.logger.forBot().info(`[FILE SYNC] Processing item ${index + 1}:`, {
      hasMarkdown: !!item.markdown,
      hasHtml: !!item.html,
      hasText: !!item.text,
      url: item.url || item.metadata?.url,
    });

    if (item.markdown) {
      this.logger.forBot().info(`[FILE SYNC] Using markdown content (${item.markdown.length} chars)`);
      return { content: item.markdown, extension: 'md' };
    }
    
    if (item.html) {
      this.logger.forBot().info(`[FILE SYNC] Using HTML content (${item.html.length} chars)`);
      return { content: item.html, extension: 'html' };
    }
    
    if (item.text) {
      this.logger.forBot().info(`[FILE SYNC] Using text content (${item.text.length} chars)`);
      return { content: item.text, extension: 'txt' };
    }

    return null;
  }

  private generateFilename(item: DatasetItem, index: number): string {
    const url = item.url || item.metadata?.url;
    
    if (!url) {
      this.logger.forBot().info(`[FILE SYNC] No URL found, using index-based filename`);
      return `page-${index + 1}`;
    }

    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      
      // Remove leading underscore if present
      pathname = pathname.replace(/^_+/, '');
      
      // Handle root URLs and empty pathnames
      if (!pathname || pathname === '_' || pathname === '') {
        return 'index';
      }
      
      this.logger.forBot().info(`[FILE SYNC] Generated filename from URL: ${url} -> "${pathname}"`);
      return pathname;
    } catch (urlError) {
      this.logger.forBot().warn(`[FILE SYNC] Invalid URL, using index: ${url}`, urlError);
      return `page-${index + 1}`;
    }
  }

  private async uploadFileToBotpress(filename: string, content: string, extension: string, kbId: string): Promise<void> {
    // Ensure filename is not too long and has valid characters
    const safeFilename = filename.substring(0, 100).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fullFilename = `${safeFilename}.${extension}`;

    this.logger.forBot().info(`[FILE SYNC] Uploading asset: ${fullFilename}`);

    const uploadResult = await this.bpClient.uploadFile({
      key: fullFilename,
      tags: {
        kbId: kbId,
        dsType: "document",
        source: "knowledge-base"
      },
      content: Buffer.from(content, 'utf8'),
      contentType: this.getContentType(extension),
      index: true
    });

    this.logger.forBot().info(`[FILE SYNC] Upload successful: ${fullFilename}`, uploadResult);
  }

  private getContentType(extension: string): string {
    switch (extension) {
      case 'md': return 'text/markdown';
      case 'html': return 'text/html';
      case 'txt': return 'text/plain';
      default: return 'text/plain';
    }
  }

  private isLastPage(offset: number, limit: number, total: number): boolean {
    return offset + limit >= total;
  }

  private getNextOffset(offset: number, limit: number): number {
    return offset + limit;
  }

  private async fetchAllDatasetItems(dataset: ApifyDataset): Promise<DatasetItem[]> {
    let allItems: DatasetItem[] = [];
    let offset = 0;
    const limit = 1000;
    const startTime = Date.now();
    const maxDuration = 45000; // 45 seconds safety margin

    while (true) {
      if (Date.now() - startTime > maxDuration) {
        this.logger.forBot().warn(`Timeout approaching, stopping at ${allItems.length} items`);
        break;
      }

      const { items, total } = await dataset.listItems({ limit, offset });
      
      this.logger.forBot().info(`Fetched ${items.length} items (offset: ${offset}, total: ${total})`);
      
      allItems.push(...items);
      
      if (this.isLastPage(offset, limit, total)) {
        break;
      }
      
      offset = this.getNextOffset(offset, limit);
    }

    this.logger.forBot().info(`[FETCH] Completed: ${allItems.length} items in ${Date.now() - startTime}ms`);
    return allItems;
  }
}

export const getClient = (
  apiToken: string,
  bpClient: bp.Client,
  logger: bp.Logger
) => {
  return new ApifyApi(apiToken, bpClient, logger);
};
