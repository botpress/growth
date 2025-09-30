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
  }

  private getContentType(extension: string): string {
    switch (extension) {
      case 'md': return 'text/markdown';
      case 'html': return 'text/html';
      case 'txt': return 'text/plain';
      default: return 'text/plain';
    }
  }     


  async fetchAndSyncStreaming(dataset: ApifyDataset, kbId: string, syncFunction: (items: DatasetItem[], kbId: string) => Promise<number>, _timeLimitMs: number = 0, startOffset: number = 0): Promise<{ itemsProcessed: number; hasMore: boolean; nextOffset: number; total: number; filesCreated: number }> {
    const streamStartTime = Date.now()
    let offset = startOffset;
    let total = 0;
    let itemsProcessed = 0;
    let filesCreated = 0;

    // process files one at a time with 100 seconds timeout detection
    const MAX_EXECUTION_TIME = 100000;
    
    while (true) {
      try {
        const elapsed = Date.now() - streamStartTime;
        if (elapsed > MAX_EXECUTION_TIME) {
          this.logger.forBot().warn(`[STREAMING] Approaching 100s limit (${elapsed}ms), stopping at offset ${offset}`);
          return { itemsProcessed, hasMore: true, nextOffset: offset, total, filesCreated };
        }

        const { items, total: currentTotal } = await dataset.listItems({ limit: 1, offset });
        
        if (currentTotal !== undefined) {
          total = currentTotal;
        }
        
        if (items.length > 0) {
          this.logger.forBot().info(`[STREAMING] Fetched 1 item (offset: ${offset}, total: ${total})`);
          
          // sync single item
          const syncResult = await syncFunction(items, kbId);
          filesCreated += syncResult;
          itemsProcessed++;
          
          this.logger.forBot().info(`[STREAMING] Synced item ${itemsProcessed}, files created: ${syncResult}`);
          
          offset++;
          
          // check if all items have been processed
          if (total > 0 && offset >= total) {
            this.logger.forBot().info(`[STREAMING] All items processed: ${itemsProcessed} items processed, ${filesCreated} files created`);
            return { itemsProcessed, hasMore: false, nextOffset: 0, total, filesCreated };
          }
        } else {
          this.logger.forBot().info(`[STREAMING] Dataset completed: ${itemsProcessed} items processed, ${filesCreated} files created`);
          return { itemsProcessed, hasMore: false, nextOffset: 0, total, filesCreated };
        }
      } catch (error) {
        this.logger.forBot().error(`[STREAMING] Error fetching/syncing dataset items:`, error);
        return { itemsProcessed, hasMore: true, nextOffset: offset, total, filesCreated };
      }
    }
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

