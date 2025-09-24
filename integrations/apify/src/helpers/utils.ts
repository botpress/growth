import { ApifyCrawlerParams, CrawlerRunInput, DatasetItem, ApifyDataset } from '../misc/types';
import * as bp from '.botpress';

export class Utils {
  constructor(
    private bpClient: bp.Client,
    private logger: bp.Logger
  ) {}

  processItemContent(item: DatasetItem): { content: string; extension: string } | null {
    this.logger.forBot().info(`[FILE SYNC] Processing item:`, {
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
      
      this.logger.forBot().info(`[FILE SYNC] Generated filename from URL: ${url} -> "${pathname}"`);
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

  async fetchAllDatasetItems(dataset: ApifyDataset): Promise<DatasetItem[]> {
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

  private isLastPage(offset: number, limit: number, total: number): boolean {
    return offset + limit >= total;
  }

  private getNextOffset(offset: number, limit: number): number {
    return offset + limit;
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

