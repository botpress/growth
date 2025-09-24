import { ApifyCrawlerParams, ReturnType } from './types';
  
export function buildCrawlerInput(params: ApifyCrawlerParams): ReturnType {
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