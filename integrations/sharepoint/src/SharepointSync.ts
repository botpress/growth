import { BotpressKB } from "./BotpressKB";
import { SharepointClient } from "./SharepointClient";
import path from "path";
import { getFormatedCurrTime } from "./utils";
import * as sdk from "@botpress/sdk";

const SUPPORTED_FILE_EXTENSIONS = [".txt", ".html", ".pdf", ".doc", ".docx"];

export class SharepointSync {
  private sharepointClient: SharepointClient;
  private bpClient: sdk.IntegrationSpecificClient<any>;
  private logger: sdk.IntegrationLogger;
  private enableVision: boolean;
  private kbInstances = new Map<string, BotpressKB>();

  constructor(
    sharepointClient: SharepointClient,
    bpClient: sdk.IntegrationSpecificClient<any>,
    logger: sdk.IntegrationLogger,
    enableVision: boolean = false
  ) {
    this.sharepointClient = sharepointClient;
    this.bpClient = bpClient;
    this.logger = logger;
    this.enableVision = enableVision;
  }

  private log(msg: string) {
    this.logger.forBot().info(`[${getFormatedCurrTime()} - SP Sync] ${msg}`);
  }

  private logWarning(msg: string) {
    this.logger.forBot().warn(`[${getFormatedCurrTime()} - SP Sync] ${msg}`);
  }

  private isFileSupported(spPath: string): boolean {
    const fileType = path.extname(spPath);
    if (!SUPPORTED_FILE_EXTENSIONS.includes(fileType)) {
      this.logWarning(`File "${spPath}" with type "${fileType}" is not supported. Skipping file.`);
      return false;
    }
    return true;
  }

  private getOrCreateKB(kbId: string): BotpressKB {
    if (!this.kbInstances.has(kbId)) {
      const kb = new BotpressKB(this.bpClient, kbId, this.logger, this.enableVision);
      this.kbInstances.set(kbId, kb);
      this.log(`Created BotpressKB instance for KB ${kbId}${this.enableVision ? ' with vision enabled' : ''}`);
    }
    return this.kbInstances.get(kbId)!;
  }

  async loadAllDocumentsIntoBotpressKB(): Promise<void> {
    // 1 - Fetch all files in this doclib
    const items = await this.sharepointClient.listItems()
    const docs  = items.filter((i) => i.FileSystemObjectType === 0)
  
    // 2 - Determine which KBs those files map to
    const kbIdsToClear = new Set<string>()
    for (const doc of docs) {
      const spPathOrNull = await this.sharepointClient.getFilePath(doc.Id)
      if (!spPathOrNull) {
        continue
      }
      // now TS knows spPath is string
      const spPath = spPathOrNull
  
      // skip unsupported extensions early
      if (!this.isFileSupported(spPath)) {
        continue
      }
  
      const relPath = decodeURIComponent(
        spPath.replace(/^\/sites\/[^/]+\//, "")
      )
      const targetKbs = this.sharepointClient.getKbForPath(relPath)
      for (const kb of targetKbs) {
        kbIdsToClear.add(kb)
      }
    }
  
    // 3 - Clear only those KBs
    await Promise.all(
      Array.from(kbIdsToClear).map((kbId) =>
        this.getOrCreateKB(kbId).deleteAllFiles()
      )
    )
  
    // 4 - Download & re‑add each file
    await Promise.all(
      docs.map(async (doc) => {
        const spPathOrNull = await this.sharepointClient.getFilePath(doc.Id)
        if (!spPathOrNull) {
          return
        }
        const spPath = spPathOrNull
  
        if (!this.isFileSupported(spPath)) {
          return
        }
  
        const relPath = decodeURIComponent(
          spPath.replace(/^\/sites\/[^/]+\//, "")
        )

        const kbIds = this.sharepointClient.getKbForPath(relPath)
        if (kbIds.length === 0) {
          return
        }
  
        const content = await this.sharepointClient.downloadFile(spPath)
        await Promise.all(
          kbIds.map((kbId) =>
            this.getOrCreateKB(kbId).addFile(
              doc.Id.toString(),
              relPath,
              content
            )
          )
        )
      })
    )
  }

  async syncSharepointDocumentLibraryAndBotpressKB(oldToken: string): Promise<string> {
    const changes = await this.sharepointClient.getChanges(oldToken);
    if (changes.length === 0) return oldToken;

    const newToken = changes.at(-1)!.ChangeToken.StringValue;

    for (const ch of changes) {
      this.logger.forBot()
        .debug(
          `[${getFormatedCurrTime()} - SP Sync] ChangeType=${ch.ChangeType} (${
            ch.ChangeType ?? "Unknown"
          })  ItemId=${ch.ItemId}`
        );

      switch (ch.ChangeType) {
        /* 1 = Add */
        case 1: {
          const spPath = await this.sharepointClient.getFilePath(ch.ItemId);
          if (!spPath || !this.isFileSupported(spPath)) break;

          const relPath = decodeURIComponent(spPath.replace(/^\/sites\/[^/]+\//, ""));
          const kbIds   = this.sharepointClient.getKbForPath(relPath);
          if (kbIds.length === 0) break;

          const content = await this.sharepointClient.downloadFile(spPath);
          for (const kbId of kbIds) {
            await this.getOrCreateKB(kbId).addFile(ch.ItemId.toString(), relPath, content);
          }
          break;
        }

        /* 2 = Update */
        case 2: {
          const spPath = await this.sharepointClient.getFilePath(ch.ItemId);
          if (!spPath || !this.isFileSupported(spPath)) break;

          const relPath = decodeURIComponent(spPath.replace(/^\/sites\/[^/]+\//, ""));
          const kbIds   = this.sharepointClient.getKbForPath(relPath);
          if (kbIds.length === 0) break;

          const content = await this.sharepointClient.downloadFile(spPath);
          for (const kbId of kbIds) {
            await this.getOrCreateKB(kbId).updateFile(ch.ItemId.toString(), relPath, content);
          }
          break;
        }

        /* 3 = Delete */
        case 3: {
          const fileId = ch.ItemId.toString();
          const res = await this.bpClient.listFiles({ tags: { spId: fileId } });

          if (res.files.length === 0) {
            this.logger.forBot().debug(`[SP Sync] spId=${fileId} not found in any KB`);
            break;
          }

          // Delete every hit (usually one)
          await Promise.all(res.files.map(f => this.bpClient.deleteFile({ id: f.id })));

          // Optional: log where it was
          res.files.forEach(f =>
            this.logger.forBot().info(`[BP KB] Delete → ${f.key}  (spId=${fileId})`)
          );
          break;
        }
      }
    }

    return newToken;
  }
}
