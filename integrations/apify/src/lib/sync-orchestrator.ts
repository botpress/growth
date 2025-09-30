import { DatasetItem, ApifyDataset } from '../misc/types';
import { DataTransformer } from '../helpers/data-transformer';
import { BotpressHelper } from '../helpers/botpress-helper';
import * as bp from '.botpress';

export class SyncOrchestrator {
  private dataTransformer: DataTransformer;
  private botpressHelper: BotpressHelper;

  constructor(
    private bpClient: bp.Client,
    private logger: bp.Logger
  ) {
    this.dataTransformer = new DataTransformer(logger);
    this.botpressHelper = new BotpressHelper(bpClient);
  }

  async fetchAndSyncStreaming(
    dataset: ApifyDataset,
    kbId: string,
    syncFunction: (items: DatasetItem[], kbId: string) => Promise<number>,
    _timeLimitMs: number = 0,
    startOffset: number = 0
  ): Promise<{ itemsProcessed: number; hasMore: boolean; nextOffset: number; total: number; filesCreated: number }> {
    const streamStartTime = Date.now();
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
          return { itemsProcessed, hasMore: true, nextOffset: offset, total, filesCreated };
        }

        const { items, total: currentTotal } = await dataset.listItems({ limit: 1, offset });
        
        if (currentTotal !== undefined) {
          total = currentTotal;
        }
        
        if (items.length > 0) {          
          // sync single item
          const syncResult = await syncFunction(items, kbId);
          filesCreated += syncResult;
          itemsProcessed++;
          offset++;
          
          // check if all items have been processed
          if (total > 0 && offset >= total) {
            return { itemsProcessed, hasMore: false, nextOffset: 0, total, filesCreated };
          }
        } else {
          return { itemsProcessed, hasMore: false, nextOffset: 0, total, filesCreated };
        }
      } catch (error) {
        this.logger.forBot().error(`Error at offset ${offset}:`, error);
        return { itemsProcessed, hasMore: true, nextOffset: offset, total, filesCreated };
      }
    }
  }

  async syncContentToBotpress(items: DatasetItem[], kbId: string): Promise<number> {
    let filesCreated = 0;

    for (const item of items) {
      try {
        const processedItem = this.dataTransformer.processItemContent(item);
        if (!processedItem) {
          continue;
        }

        const filename = this.dataTransformer.generateFilename(item);
        const fullFilename = `${filename}.${processedItem.extension}`;

        await this.botpressHelper.uploadFile(fullFilename, processedItem.content, processedItem.extension, kbId);
        filesCreated++;
      } catch (error) {
        this.logger.forBot().error(`Error processing item:`, error);
      }
    }
    return filesCreated;
  }
}
