import { ApifyClient, ApifyApiError } from 'apify-client';
import * as bp from '.botpress';
import { CrawlerRunInput } from './misc/types';

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

  async getRunStatus(runId: string) {
    this.logger.forBot().info(`Getting status for run ID: ${runId}`);

    const run = await this.client.run(runId).get();

    this.logger.forBot().info(`Run status retrieved. Status: ${run?.status}`);

    return {
      runId: run?.id,
      status: run?.status,
    }
  }

  async getAndSyncRunResults(runId: string, kbId: string) {
    try {
      const run = await this.client.run(runId).get();
      
      if (!run) {
        return {
          success: false,
          message: 'Run not found',
          data: {
            runId,
            error: 'Run not found',
          },
        };
      }
      
      if (run.status !== 'SUCCEEDED') {
        return {
          success: false,
          message: `Run is not completed. Current status: ${run.status}`,
          data: {
            runId: run.id,
            status: run.status,
          },
        };
      }

      if (!run.defaultDatasetId) {
        throw new Error('No dataset ID found for completed run');
      }

      this.logger.forBot().info(`Getting results from dataset: ${run.defaultDatasetId}`);

      const dataset = this.client.dataset(run.defaultDatasetId);
      let allItems;
      try {
        allItems = await this.fetchAllDatasetItems(dataset);
        this.logger.forBot().info(`Retrieved ${allItems.length} total items from dataset`);
      } catch (error) {
        this.logger.forBot().error('Error fetching dataset items:', error);
        return {
          success: false,
          message: 'Error fetching dataset items',
          data: {
            error: error instanceof Error ? error.message : 'Error fetching dataset items',
          },
        };
      }

      let filesCreated = 0;
      
      try {
        this.logger.forBot().info(`[GET AND SYNC RUN RESULTS] KB mode: indexing ${allItems.length} documents into KB ${kbId}`);
        filesCreated = await this.syncContentToBotpress(allItems, kbId);
        this.logger.forBot().info(`[GET AND SYNC RUN RESULTS] KB indexing completed. Documents indexed: ${filesCreated}`);
      } catch (error) {
        this.logger.forBot().error('Error syncing content to Botpress:', error);
        return {
          success: false,
          message: 'Error syncing content to Botpress',
          data: {
            error: error instanceof Error ? error.message : 'Error syncing content to Botpress',
          },
        };
      }

      return {
        success: true,
        message: 'Run results retrieved successfully',
        data: {
          runId: run.id,
          datasetId: run.defaultDatasetId,
          itemsCount: allItems.length,
          filesCreated,
        },
      };
    } catch (error) {
      this.logger.forBot().error('Error getting run information:', error);
      
      if (error instanceof ApifyApiError) {
        const { message, type, statusCode, clientMethod } = error;
        this.logger.forBot().error('Apify API Error:', { message, type, statusCode, clientMethod });
        
        return {
          success: false,
          message: `Apify API Error: ${message}`,
          data: {
            error: message,
            type,
            statusCode,
            clientMethod,
          },
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error in getAndSyncRunResults',
        data: {
          error: error instanceof Error ? error.message : 'Error in getAndSyncRunResults',
        },
      };
    }
  }

  private isLastPage(offset: number, limit: number, total: number): boolean {
    return offset + limit >= total;
  }

  private getNextOffset(offset: number, limit: number): number {
    return offset + limit;
  }

  private async fetchAllDatasetItems(dataset: any) {
    let allItems: {
      markdown?: string;
      html?: string;
      text?: string;
      url?: string;
      metadata?: { url?: string };
    }[] = [];
    let offset = 0;
    const limit = 1000; 

    while (true) {
      const { items, total } = await dataset.listItems({ limit, offset });
      
      this.logger.forBot().info(`Fetched ${items.length} items (offset: ${offset}, total: ${total})`);
      
      allItems.push(...items);
      
      // If there are no more items to fetch, exit the loading
      if (this.isLastPage(offset, limit, total)) {
        break;
      }
      
      offset = this.getNextOffset(offset, limit);
    }

    return allItems;
  }

  private async syncContentToBotpress(items: {
    markdown?: string;
    html?: string;
    text?: string;
    url?: string;
    metadata?: { url?: string };
  }[], kbId: string): Promise<number> {
    this.logger.forBot().info(`[FILE SYNC] Starting sync for ${items.length} items to KB ${kbId}`);
    let filesCreated = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      this.logger.forBot().info(`[FILE SYNC] Processing item ${i + 1}/${items.length}:`, {
        hasMarkdown: !!item?.markdown,
        hasHtml: !!item?.html,
        hasText: !!item?.text,
        url: item?.url || item?.metadata?.url,
        itemKeys: item ? Object.keys(item) : 'undefined'
      });
      
      if (!item) {
        this.logger.forBot().warn(`[FILE SYNC] Skipping item ${i}: Item is undefined`);
        continue;
      }
      
      try {
        let content: string;
        let extension: string;

        if ((item).markdown) {
          content = (item).markdown;
          extension = 'md';
          this.logger.forBot().info(`[FILE SYNC] Using markdown content (${content.length} chars)`);
        } else if ((item).html) {
          content = (item).html;
          extension = 'html';
          this.logger.forBot().info(`[FILE SYNC] Using HTML content (${content.length} chars)`);
        } else if ((item).text) {
          content = (item).text;
          extension = 'txt';
          this.logger.forBot().info(`[FILE SYNC] Using text content (${content.length} chars)`);
        } else {
          this.logger.forBot().warn(`[FILE SYNC] Skipping item ${i}: No content found. Item:`, item);
          continue;
        }

        // Create filename based on URL or use index
        const url = (item).url || (item).metadata?.url;
        let filename: string;

        if (url) {
          try {
            const urlObj = new URL(url);
            let pathname = urlObj.pathname.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
            
            // Remove leading underscore if present
            pathname = pathname.replace(/^_+/, '');
            
            // Handle root URLs and empty pathnames
            if (!pathname || pathname === '_' || pathname === '') {
              filename = 'index';
            } else {
              filename = pathname;
            }
            
            this.logger.forBot().info(`[FILE SYNC] Generated filename from URL: ${url} -> pathname: "${urlObj.pathname}" -> processed: "${pathname}" -> final: "${filename}"`);
          } catch (urlError) {
            this.logger.forBot().warn(`[FILE SYNC] Invalid URL, using index: ${url}`, urlError);
            filename = `page-${i + 1}`;
          }
        } else {
          this.logger.forBot().info(`[FILE SYNC] No URL found, using index-based filename`);
          filename = `page-${i + 1}`;
        }

        // Ensure filename is not too long and has valid characters
        filename = filename.substring(0, 100).replace(/[^a-zA-Z0-9_-]/g, '_');
        const fullFilename = `${filename}.${extension}`;

        this.logger.forBot().info(`[FILE SYNC] Uploading asset: ${fullFilename} (KB mode)`);

        const uploadResult = await this.bpClient.uploadFile({
          key: fullFilename,
          tags: {
            kbId: kbId || "kb-default",
            dsType: "document",
            source: "knowledge-base"
          },
          content: Buffer.from(content, 'utf8'),
          contentType: extension === 'md' ? 'text/markdown' : 
                      extension === 'html' ? 'text/html' : 'text/plain',
          index: true
        });

        this.logger.forBot().info(`[FILE SYNC] Upload successful: ${fullFilename}`, uploadResult);
        filesCreated++;
      } catch (error) {
        this.logger.forBot().error(`[FILE SYNC] Error creating file for item ${i}:`, error);
        this.logger.forBot().error(`[FILE SYNC] Item details:`, item);
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
