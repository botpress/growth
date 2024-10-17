import axios from "axios";
import * as msal from "@azure/msal-node";
import * as sdk from "@botpress/sdk";
import * as bp from ".botpress";
import { handleAxiosError } from "./utils";
import { IBotpressKB } from "./BotpressKB";
import { ChangeItem, ChangeResponse, SharePointItem, SharePointItemsResponse } from "./SharepointTypes";
import path from "path";

const SUPPORTED_FILE_EXTENSIONS = [".txt", ".html", ".pdf", ".doc"];

export interface ISharepointClient {
  /**
   * A method to get the latest change token
   */
  getLatestChangeToken(): Promise<string | null>;

  /**
   * A method to load all documents from the SharePoint document library into the Botpress Knowledge Base
   */
  loadAllDocumentsIntoBotpressKB(): Promise<void>;

  /**
   * A method to register a webhook
   * @param webhookurl - The webhook URL
   */
  registerWebhook(webhookurl: string): Promise<string>;

  /**
   * A method to unregister a webhook
   * @param webhookId - The webhook ID
   */
  unregisterWebhook(webhookId: string): Promise<void>;

  /**
   * A method to sync the SharePoint document library with the Botpress Knowledge Base
   * @param changeToken - The change token to process changes from
   * @returns - The new change token
   */
  syncSharepointDocumentLibraryAndBotpressKB(changeToken: string): Promise<string>;
}
export class SharepointClient implements ISharepointClient {
  private cca: msal.ConfidentialClientApplication;
  private primaryDomain: string;
  private siteName: string;
  private documentLibraryName: string;
  private botpressKB: IBotpressKB;

  constructor(integrationConfiguration: bp.configuration.Configuration, botpressKB: IBotpressKB) {
    this.cca = new msal.ConfidentialClientApplication({
      auth: {
        clientId: integrationConfiguration.clientId,
        authority: `https://login.microsoftonline.com/${integrationConfiguration.tenantId}`,
        clientCertificate: {
          thumbprint: integrationConfiguration.thumbprint,
          privateKey: formatPrivateKey(integrationConfiguration.privateKey),
        },
      },
    });

    this.botpressKB = botpressKB;
    this.primaryDomain = integrationConfiguration.primaryDomain;
    this.siteName = integrationConfiguration.siteName;
    this.documentLibraryName = integrationConfiguration.documentLibraryName;
  }

  /**
   * A method to acquire a token from Azure AD
   * @returns - The token
   */
  private async acquireToken(): Promise<msal.AuthenticationResult> {
    try {
      const tokenRequest = {
        scopes: [`https://${this.primaryDomain}.sharepoint.com/.default`],
      };
      const token = await this.cca.acquireTokenByClientCredential(tokenRequest);

      if (token === null) {
        throw new sdk.RuntimeError(`Error acquiring sp OAuth token`);
      }
      return token;
    } catch (e) {
      throw new sdk.RuntimeError(`Error while acquiring sp OAuth token ${e}`);
    }
  }

  /**
   * A method to return the list ID of the document library
   * @returns - The list ID
   */
  private async getDocumentLibraryListId(): Promise<string> {
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists/getbytitle('${this.documentLibraryName}')?$select=Title,Id`;
    const token = await this.acquireToken();
    const res = await axios
      .get(url, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/json;odata=verbose",
        },
      })
      .catch(handleAxiosError);

    if (!res) {
      throw new sdk.RuntimeError(`Error initializing list ID`);
    }

    return res.data.d.Id;
  }

  /**
   * Initializes the change token
   */
  async getLatestChangeToken(): Promise<string | null> {
    const changes = await this.getChanges(null);
    if (changes.length > 0) {
      const latestChange = changes.at(-1);
      if (!latestChange) {
        throw new sdk.RuntimeError(`Error initializing change token`);
      }
      return latestChange.ChangeToken.StringValue;
    }
    return null;
  }

  /**
   * A method to download a file from SharePoint
   * @param fileName - The name of the file to download
   * @returns - The file content as an ArrayBuffer
   */
  private async downloadFile(fileName: string): Promise<ArrayBuffer> {
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/GetFolderByServerRelativeUrl('${this.documentLibraryName}')/Files('${fileName}')/$value`;

    const token = await this.acquireToken();
    const authToken = `Bearer ${token.accessToken}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authToken,
      },
    });

    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  }

  /**
   * Add all the items from the SharePoint list to the Botpress Knowledge Base
   */
  async loadAllDocumentsIntoBotpressKB(): Promise<void> {
    // Delete All existing files
    await this.botpressKB.deleteAllFiles();

    const documentLibraryListItems = await this.listItems();

    const processDocuments = documentLibraryListItems.map(async (document) => {
      const documentName = await this.getFileName(document.Id);
      const content = await this.downloadFile(documentName);
      await this.botpressKB.addFile(document.ID.toString(), documentName, content);
    });

    await Promise.all(processDocuments);
  }

  /**
   * Registers a webhook for the configured document library.
   * @param webhookurl - The URL to register the webhook to.
   * @returns - The webhook ID
   */
  async registerWebhook(webhookurl: string): Promise<string> {
    // Add Webhook
    const listId = await this.getDocumentLibraryListId();
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists('${listId}')/subscriptions`;
    const token = await this.acquireToken();
    const res = await axios
      .post(
        url,
        {
          clientState: "A0A354EC-97D4-4D83-9DDB-144077ADB449",
          resource: `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists('${listId}')`,
          notificationUrl: webhookurl,
          expirationDateTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
            Accept: "application/json;odata=verbose",
          },
        }
      )
      .catch(handleAxiosError);

    if (!res) {
      throw new sdk.RuntimeError(`Error registering webhook`);
    }

    const webhookId = res.data.d.id;

    return webhookId;
  }

  /**
   * Unregisters a webhook for the configured document library.
   * @param webhookId - The ID of the webhook to unregister.
   */
  async unregisterWebhook(webhookId: string): Promise<void> {
    const listId = this.getDocumentLibraryListId();
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists('${listId}')/subscriptions('${webhookId}')`;
    const token = await this.acquireToken();
    await axios
      .delete(url, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/json;odata=verbose",
        },
      })
      .catch(handleAxiosError);
  }

  /**
   * Get the list of documents from the configured document library.
   * @returns - The list of documents.
   */
  private async listItems(): Promise<SharePointItem[]> {
    const token = await this.acquireToken();
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists/getbytitle('${this.documentLibraryName}')/items`;
    const res = await axios.get<SharePointItemsResponse>(url, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/json;odata=verbose",
      },
    });
    return res.data.d.results;
  }

  /**
   * Get the file name from the SharePoint list item
   * @param listItemIndex - The item index to get the file name for
   * @returns - The file name
   */
  private async getFileName(listItemIndex: number): Promise<string> {
    // sample url -https://botpressio836.sharepoint.com/sites/DemoStandardTeamPage/_api/web/lists/getbytitle('NewDL')/items(3)/File
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists/getbytitle('${this.documentLibraryName}')/items(${listItemIndex})/File`;
    const token = await this.acquireToken();
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        Accept: "application/json;odata=verbose",
      },
    });

    return res.data.d.Name;
  }

  /**
   * A method to get changes from a SharePoint list
   * @returns - The list of changes
   */
  private async getChanges(changeToken: string | null): Promise<ChangeItem[]> {
    const token = await this.acquireToken();
    const url = `https://${this.primaryDomain}.sharepoint.com/sites/${this.siteName}/_api/web/lists/getbytitle('${this.documentLibraryName}')/GetChanges`;

    type GetChangesPayload = {
      query: {
        Item: boolean;
        Add: boolean;
        Update: boolean;
        DeleteObject: boolean;
        ChangeTokenStart?: {
          StringValue: string;
        };
      };
    };

    const payload: GetChangesPayload = {
      query: {
        Item: true,
        Add: true,
        Update: true,
        DeleteObject: true,
      },
    };

    if (changeToken !== null) {
      payload.query.ChangeTokenStart = {
        StringValue: changeToken,
      };
    }

    const res = await axios
      .post<ChangeResponse>(url, payload, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          Accept: "application/json;odata=verbose",
        },
      })
      .catch(handleAxiosError);

    if (!res) {
      throw new sdk.RuntimeError(`Error getting changes`);
    }

    return res.data.d.results;
  }

  /**
   * Processes changes from a SharePoint list
   */
  async syncSharepointDocumentLibraryAndBotpressKB(changeToken: string): Promise<string> {
    const changes = await this.getChanges(changeToken);

    const latestChange = changes.at(-1);
    if (!latestChange) {
      console.log("No changes to process");
      return changeToken;
    }

    const newChangeToken = latestChange.ChangeToken.StringValue;

    const updatePromises = changes.map(async (change) => {
      // The entire enum is available at https://learn.microsoft.com/en-us/previous-versions/office/sharepoint-csom/ee543793(v=office.15)
      switch (change.ChangeType) {
        // ADD
        case 1: {
          try {
            console.log(`Adding file: ${change.ItemId}`);
            const fileName = await this.getFileName(change.ItemId);
            const extension = path.extname(fileName);
            if (!SUPPORTED_FILE_EXTENSIONS.includes(extension)) {
              console.log(`File extension not supported for file: ${fileName}`);
              break;
            }
            const content = await this.downloadFile(fileName);
            await this.botpressKB.addFile(change.ItemId.toString(), fileName, content);
          } catch (e) {
            console.log(`Error adding file: ${change.ItemId}: ${e}`);
          }
          break;
        }
        // Update
        case 2: {
          try {
            console.log(`Updating file: ${change.ItemId}`);
            const updatedFileName = await this.getFileName(change.ItemId);
            const updatedContent = await this.downloadFile(updatedFileName);
            // Delete the existing file and add the updated file
            await this.botpressKB.deleteFile(change.ItemId.toString());
            await this.botpressKB.addFile(change.ItemId.toString(), updatedFileName, updatedContent);
          } catch (e) {
            console.log(`Error updating file: ${change.ItemId}: ${e}`);
          }
          break;
        }
        // Delete
        case 3: {
          try {
            console.log(`Deleting file: ${change.ItemId}`);
            await this.botpressKB.deleteFile(change.ItemId.toString());
          } catch (e) {
            console.log(`Error deleting file: ${change.ItemId}: ${e}`);
          }
          break;
        }
        // Rename
        case 4: {
          try {
            console.log(`Renaming file: ${change.ItemId}`);
            const renamedFileName = await this.getFileName(change.ItemId);
            const content = await this.downloadFile(renamedFileName);
            // Delete the existing file and add the updated file
            await this.botpressKB.deleteFile(change.ItemId.toString());
            await this.botpressKB.addFile(change.ItemId.toString(), renamedFileName, content);
          } catch (e) {
            console.log(`Error renaming file: ${change.ItemId}: ${e}`);
          }
          break;
        }
        default: {
          console.log(`Change type not supported (yet): ${change.ChangeType}`);
          break;
        }
      }
    });

    await Promise.all(updatePromises);
    return newChangeToken;
  }
}

/**
 * Factory function to create a SharepointClient
 * @param integrationConfiguration - The integration configuration object
 * @param botpressKB - The BotpressKB object
 * @returns - The SharepointClient
 */
export const createSharepointClient = (
  integrationConfiguration: bp.configuration.Configuration,
  botpressKB: IBotpressKB
): ISharepointClient => {
  return new SharepointClient(integrationConfiguration, botpressKB);
};

/**
 * A helper function to format the private key in the RS256 format ( There is probably a better way to do this ... )
 * @param privateKey
 * @returns
 */
const formatPrivateKey = (privateKey: string) => {
  return `-----BEGIN PRIVATE KEY-----\n${privateKey.split(" ").join("\n")}\n-----END PRIVATE KEY-----`;
};
