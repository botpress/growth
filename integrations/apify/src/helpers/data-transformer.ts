import { ApifyCrawlerParams, CrawlerRunInput, DatasetItem } from '../misc/types';
import * as bp from '.botpress';

export class DataTransformer {
  constructor(private logger: bp.Logger) {}

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
      this.logger.forBot().warn(`Invalid URL, using timestamp-based fallback: ${url}`, urlError);
      return `page-${Date.now()}`;
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
