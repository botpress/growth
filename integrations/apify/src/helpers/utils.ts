import { ApifyCrawlerParams, CrawlerRunInput, DatasetItem, ApifyDataset } from '../misc/types';
import * as bp from '.botpress';

export class Utils {
  constructor(
    private bpClient: bp.Client,
    private logger: bp.Logger
  ) {}

  processItemContent(item: DatasetItem): { content: string; extension: string } | null {
    if (item.markdown) {
      return { content: item.markdown, extension: 'md' };
    }
    
    if (item.html) {
      return { content: item.html, extension: 'html' };
    }
    
    if (item.text) {
      return { content: item.text, extension: 'txt' };
    }

    return null;
  }

  generateFilename(item: DatasetItem): string {
    const url = item.url || item.metadata?.url;
    
    if (!url) {
      this.logger.forBot().info(`[FILE SYNC] No URL found, using timestamp-based filename`);
      return `page-${Date.now()}`;
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
      
      return pathname;
    } catch (urlError) {
      this.logger.forBot().warn(`[FILE SYNC] Invalid URL, using timestamp-based fallback: ${url}`, urlError);
      return `page-${Date.now()}`;
    }
  }

  async uploadFileToBotpress(filename: string, content: string, extension: string, kbId: string): Promise<void> {
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

    this.logger.forBot().info(`[FILE SYNC] Upload successful: ${fullFilename}`);
  }

  private getContentType(extension: string): string {
    switch (extension) {
      case 'md': return 'text/markdown';
      case 'html': return 'text/html';
      case 'txt': return 'text/plain';
      default: return 'text/plain';
    }
  }     


  async fetchAndSyncStreaming(dataset: ApifyDataset, kbId: string, syncFunction: (items: DatasetItem[], kbId: string) => Promise<number>, timeLimitMs: number = 50000, startOffset: number = 0): Promise<{ itemsProcessed: number; hasMore: boolean; nextOffset: number; total: number; filesCreated: number }> {
    return new Promise((resolve) => {
      const streamStartTime = Date.now()
      let offset = startOffset;
      let isTimedOut = false;
      let isResolved = false;
      let total = 0;
      let itemsProcessed = 0;
      let filesCreated = 0;

      this.logger.forBot().info(`[STREAMING] Starting streaming fetch & sync: 1 item per fetch, ${timeLimitMs}ms timeout, offset: ${startOffset} at ${new Date().toISOString()}`);

      // timeout function to stop fetching items when time limit is reached
      const timeoutId = setTimeout(() => {
        isTimedOut = true;
        isResolved = true;
        const timeoutTime = Date.now()
        const actualDuration = timeoutTime - streamStartTime
        this.logger.forBot().warn(`[STREAMING] Time limit reached after ${timeLimitMs}ms (actual: ${actualDuration}ms), stopping at ${itemsProcessed} items. More data may be available.`);
        resolve({ itemsProcessed, hasMore: true, nextOffset: offset, total, filesCreated });
      }, timeLimitMs);

      // recursive function to fetch and sync items one by one
      const fetchAndSyncItems = async (): Promise<void> => {
        if (isTimedOut || isResolved) {
          return;
        }

        try {
          const { items, total: currentTotal } = await dataset.listItems({ limit: 1, offset });
          
          if (currentTotal !== undefined) {
            total = currentTotal;
          }
          
          if (items.length > 0) {
            this.logger.forBot().info(`[STREAMING] Fetched 1 item (offset: ${offset}, total: ${total})`);
            
            // sync single item immediately
            const syncResult = await syncFunction(items, kbId);
            filesCreated += syncResult;
            itemsProcessed++;
            
            this.logger.forBot().info(`[STREAMING] Synced item ${itemsProcessed}, files created: ${syncResult}`);
            
            offset++;
            
            // Check if we've processed all available items
            if (total > 0 && offset >= total) {
              clearTimeout(timeoutId);
              isResolved = true;
              this.logger.forBot().info(`[STREAMING] All items processed naturally: ${itemsProcessed} items processed, ${filesCreated} files created (total: ${total})`);
              resolve({ itemsProcessed, hasMore: false, nextOffset: 0, total, filesCreated });
              return;
            }
            
            if (!isTimedOut && !isResolved) {
              // to avoid blocking the event loop
              setImmediate(fetchAndSyncItems);
            } else {
              // Timeout has fired or resolved, stop processing
              this.logger.forBot().info(`[STREAMING] Timeout/resolved detected, stopping processing at item ${itemsProcessed}`);
              return;
            }
          } else {
            clearTimeout(timeoutId);
            isResolved = true;
            const completionTime = Date.now()
            const actualDuration = completionTime - streamStartTime
            this.logger.forBot().info(`[STREAMING] Dataset completed: ${itemsProcessed} items processed, ${filesCreated} files created in ${actualDuration}ms (${(actualDuration/1000).toFixed(2)}s)`);
            resolve({ itemsProcessed, hasMore: false, nextOffset: 0, total, filesCreated });
            return;
          }
        } catch (error) {
          clearTimeout(timeoutId);
          this.logger.forBot().error(`[STREAMING] Error fetching/syncing dataset items:`, error);
          resolve({ itemsProcessed, hasMore: true, nextOffset: offset, total, filesCreated });
        }
      };
      fetchAndSyncItems();
    });
  }
}

export function buildCrawlerInput(params: ApifyCrawlerParams): CrawlerRunInput {
  if (params.rawInputJsonOverride) {
    const parsed = JSON.parse(params.rawInputJsonOverride);      
    if (parsed.startUrls && Array.isArray(parsed.startUrls)) {
      return {
        ...parsed,
        startUrls: parsed.startUrls.map((url: string | { url: string }) => 
          typeof url === 'string' ? { url } : url
        )
      };
    }
    return parsed;  
  }
  return{
    ...params,
    startUrls: params.startUrls.map((url: string | { url: string }) => 
      typeof url === 'string' ? { url } : url
    )
  }
}

