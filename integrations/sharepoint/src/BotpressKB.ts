import * as sdk from "@botpress/sdk";
import { BaseIntegration } from "@botpress/sdk/dist/integration/generic";

export interface IBotpressKB {
  getFile(id: string): Promise<unknown>;
  addFile(id: string, filename: string, content: ArrayBuffer): Promise<void>;
  deleteFile(id: string): Promise<void>;
  deleteAllFiles(): Promise<void>;
}

export class BotpressKB implements IBotpressKB {
  private bpClient: sdk.IntegrationSpecificClient<any>;
  private logger: sdk.IntegrationLogger;
  private kbId = "kb-93e4276fec"; // TODO: This should be in the configuration

  constructor(bpClient: sdk.IntegrationSpecificClient<any>, logger: sdk.IntegrationLogger) {
    this.bpClient = bpClient;
    this.logger = logger;
  }

  async getFile(spId: string): Promise<unknown> {
    const files = await this.bpClient.listFiles({ tags: { spId: spId } });
    return files.files[0];
  }

  async addFile(spId: string, filename: string, content: ArrayBuffer): Promise<void> {
    this.logger.forBot().info(`Adding file: ${filename}`);

    await this.bpClient.uploadFile({
      key: filename,
      content,
      index: true,
      tags: {
        source: "knowledge-base",
        kbId: this.kbId,
        spId: spId,
      },
    });

    this.logger.forBot().info(`File added: ${filename}`);
  }

  async deleteFile(spId: string): Promise<void> {
    this.logger.forBot().info(`Deleting file: ${spId}`);

    const existingFiles = await this.bpClient.listFiles({ tags: { spId: spId } });
    const existingFile = existingFiles.files[0];
    if (!existingFile) {
      throw new sdk.RuntimeError(`File with id ${spId} not found`);
    }

    await this.bpClient.deleteFile({ id: existingFile.id });

    this.logger.forBot().info(`File deleted: ${spId}`);
  }

  async deleteAllFiles(): Promise<void> {
    this.logger.forBot().info(`Deleting all files in knowledge base: ${this.kbId}`);
    const existingFiles = await this.bpClient.listFiles({ tags: { kbId: this.kbId } });

    const deletePromises = existingFiles.files.map(async (file) => await this.bpClient.deleteFile({ id: file.id }));

    await Promise.all(deletePromises);
    this.logger.forBot().info(`All files deleted in knowledge base: ${this.kbId}`);
  }

  async updateFile(spId: string, filename: string, content: ArrayBuffer): Promise<void> {
    this.logger.forBot().info(`Updating file: ${filename}`);

    const existingFiles = await this.bpClient.listFiles({ tags: { spId: spId } });
    const existingFile = existingFiles.files[0];
    if (!existingFile) {
      throw new sdk.RuntimeError(`File with id ${spId} not found`);
    }

    this.logger.forBot().info(`File updated: ${filename}`);
  }
}
