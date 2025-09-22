import { ApifyClient, ApifyApiError } from 'apify-client';
import * as bp from '.botpress';

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
  async startCrawlerRun(params: {
    startUrls: string[];
    excludeUrlGlobs?: string[];
    includeUrlGlobs?: string[];
    maxCrawlPages?: number;
    saveMarkdown?: boolean;
    htmlTransformer?: 'readableText' | 'readableTextIfPossible' | 'minimal' | 'none';
    removeElementsCssSelector?: string;
    crawlerType?: 'playwright:adaptive' | 'playwright:firefox' | 'cheerio' | 'jsdom' | 'playwright:chrome';
    expandClickableElements?: boolean;
    headers?: Record<string, string>;
    rawInputJsonOverride?: string;
    kbId: string;
  }) {
    try {
      let input = params.rawInputJsonOverride ? (() => {
        const parsed = JSON.parse(params.rawInputJsonOverride);
        return parsed.startUrls && Array.isArray(parsed.startUrls) 
          ? { ...parsed, startUrls: parsed.startUrls.map((url: string | { url: string }) => 
              typeof url === 'string' ? { url } : url
            ) }
          : parsed;
      })() : {
        startUrls: params.startUrls.map(url => ({ url })),
        excludeUrlGlobs: params.excludeUrlGlobs || [],
        includeUrlGlobs: params.includeUrlGlobs || ['**/*'],
        maxCrawlPages: params.maxCrawlPages || 10,
        saveMarkdown: params.saveMarkdown ?? false, 
        htmlTransformer: params.htmlTransformer || 'readableTextIfPossible',
        removeElementsCssSelector: params.removeElementsCssSelector || '',
        crawlerType: params.crawlerType || 'playwright:firefox',
        expandClickableElements: params.expandClickableElements || false,
        kbId: params.kbId,
      };
      
      if (params.headers && Object.keys(params.headers).length > 0) {
        input.headers = params.headers;
      }

      this.logger.forBot().info('Starting Apify Website Content Crawler with input:', JSON.stringify(input, null, 2));

      const run = await this.client.actor('apify/website-content-crawler').call(input, { waitSecs: 0 });

      if (!run || !run.id) {
        throw new Error('Failed to start crawler run');
      }

      this.logger.forBot().info(`Crawler run started with ID: ${run.id}`);

      return {
        success: true,
        message: 'Crawler run started successfully',
        data: {
          runId: run.id,
          status: run.status,
        },
      };
    } catch (error) {
      this.logger.forBot().error('Error in startCrawlerRun:', error);
      
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

  async getRunStatus(runId: string) {
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
      
      return {
        success: true,
        message: 'Run status retrieved successfully',
        data: {
          runId: run.id,
          status: run.status,
          startedAt: run.startedAt?.toISOString() || null,
          finishedAt: run.finishedAt?.toISOString() || null,
          defaultDatasetId: run.defaultDatasetId,
        },
      };
    } catch (error) {
      this.logger.forBot().error('Error in getRunStatus:', error);
      
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

  async getAndSyncRunResults(runId: string, syncTargetPath?: string, kbId?: string) {
    const targetPath = syncTargetPath || './crawled-content/';
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
        // Manual sync
        if (syncTargetPath) {
          this.logger.forBot().info(`[GET AND SYNC RUN RESULTS] Starting file sync to path: ${targetPath}`);
          filesCreated = await this.syncContentToBotpress(allItems, targetPath, kbId || "kb-default");
          this.logger.forBot().info(`[GET AND SYNC RUN RESULTS] File sync completed. Files created: ${filesCreated}`);
        // Webhook sync
        } else if (kbId) {
          this.logger.forBot().info(`[GET AND SYNC RUN RESULTS] KB mode: indexing ${allItems.length} documents into KB ${kbId}`);
          filesCreated = await this.syncContentToBotpress(allItems, undefined, kbId);
          this.logger.forBot().info(`[GET AND SYNC RUN RESULTS] KB indexing completed. Documents indexed: ${filesCreated}`);
        } else {
          this.logger.forBot().info(`[GET AND SYNC RUN RESULTS] Starting file sync to default path: ${targetPath}`);
          filesCreated = await this.syncContentToBotpress(allItems, targetPath, kbId || "kb-default");
          this.logger.forBot().info(`[GET AND SYNC RUN RESULTS] File sync completed. Files created: ${filesCreated}`);
        }
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
          syncTargetPath: targetPath,
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
  }[], targetPath: string | undefined, kbId: string): Promise<number> {
    this.logger.forBot().info(`[FILE SYNC] Starting sync for ${items.length} items${targetPath ? ` to path: ${targetPath}` : ''}`);
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
        const filePath = targetPath ? `${targetPath}/${fullFilename}` : fullFilename;

        this.logger.forBot().info(`[FILE SYNC] Uploading asset: ${filePath} ${targetPath ? '' : '(KB mode, no folder)'}`);

        const uploadResult = await this.bpClient.uploadFile({
          key: filePath,
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

        this.logger.forBot().info(`[FILE SYNC] Upload successful: ${filePath}`, uploadResult);
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
