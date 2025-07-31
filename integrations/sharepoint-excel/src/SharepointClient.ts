import axios, { AxiosInstance } from "axios";
import * as msal from "@azure/msal-node";
import { formatPrivateKey } from "./utils";

// Properties needed to initialize the SharepointClient
export interface SharepointClientProps {
  primaryDomain: string; // e.g., "contoso" (will be appended with .sharepoint.com) or "contoso.sharepoint.com"
  siteName: string; // e.g., "MyTeamSite" as it appears in the URL
  clientId: string;
  tenantId: string;
  thumbprint: string;
  privateKey: string;
}

export class SharepointClient {
  private msalClient: msal.ConfidentialClientApplication;
  private graphApi: AxiosInstance;
  private siteIdCache?: string;
  private primaryDomain: string;
  private siteName: string;

  constructor(props: SharepointClientProps) {
    this.primaryDomain = props.primaryDomain;
    this.siteName = props.siteName;

    const msalConfig: msal.Configuration = {
      auth: {
        clientId: props.clientId,
        authority: `https://login.microsoftonline.com/${props.tenantId}`,
        clientCertificate: {
          thumbprint: props.thumbprint,
          privateKey: formatPrivateKey(props.privateKey),
        },
      },
    };
    this.msalClient = new msal.ConfidentialClientApplication(msalConfig);

    this.graphApi = axios.create({
      baseURL: "https://graph.microsoft.com/v1.0",
    });

    this.graphApi.interceptors.request.use(
      async (config) => {
        const tokenResponse =
          await this.msalClient.acquireTokenByClientCredential({
            scopes: ["https://graph.microsoft.com/.default"],
          });
        if (tokenResponse?.accessToken) {
          config.headers.Authorization = `Bearer ${tokenResponse.accessToken}`;
        } else {
          console.error("SharepointClient: Failed to acquire access token.");
          throw new Error("SharepointClient: Failed to acquire access token.");
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  public async getSiteId(): Promise<string> {
    if (this.siteIdCache) {
      return this.siteIdCache;
    }

    // Construct hostname: if primaryDomain doesn't include .sharepoint.com, append it.
    const hostname = this.primaryDomain.includes(".sharepoint.com")
      ? this.primaryDomain
      : `${this.primaryDomain}.sharepoint.com`;

    // Path to get site by hostname and server-relative path of the site
    const siteGraphPath = `/sites/${hostname}:/sites/${this.siteName}`;

    try {
      // console.debug(`SharepointClient: Fetching site ID with path: ${siteGraphPath}`);
      const response = await this.graphApi.get(siteGraphPath);
      this.siteIdCache = response.data.id;
      if (!this.siteIdCache) {
        throw new Error(
          `Could not retrieve a valid site ID for hostname "${hostname}" and site name "${this.siteName}" using Graph path "${siteGraphPath}". Response: ${JSON.stringify(response.data)}`,
        );
      }
      // console.debug(`SharepointClient: Site ID ${this.siteIdCache} obtained for ${this.siteName}`);
      return this.siteIdCache;
    } catch (error: any) {
      const errorMessage = `SharepointClient: Error fetching site ID for Graph path "${siteGraphPath}". Status: ${error.response?.status}. Data: ${JSON.stringify(error.response?.data)}. Message: ${error.message}`;
      console.error(errorMessage, error.stack);
      throw new Error(errorMessage);
    }
  }

  // Helper method to list all document libraries in the site
  public async listDocumentLibraries(): Promise<
    Array<{ id: string; name: string; webUrl: string }>
  > {
    const siteId = await this.getSiteId();

    try {
      const response = await this.graphApi.get(`/sites/${siteId}/drives`);
      return response.data.value.map((drive: any) => ({
        id: drive.id,
        name: drive.name,
        webUrl: drive.webUrl,
      }));
    } catch (error: any) {
      console.error("Error listing document libraries:", error);
      throw error;
    }
  }

  public async getFileContentByUrl(fileUrl: string): Promise<Buffer> {
    let relativePath: string;

    try {
      // Handle relative path (e.g. /NewDL/Book.xlsx)
      relativePath = fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
    } catch (e: any) {
      console.error(
        `SharepointClient: Invalid SharePoint file path provided: ${fileUrl}`,
        e.message,
      );
      throw new Error(
        `Invalid SharePoint file path: "${fileUrl}". Error: ${e.message}`,
      );
    }

    const siteId = await this.getSiteId();

    // Split the path to separate document library from file path
    // e.g., "doclib1/Book.xlsx" -> ["doclib1", "Book.xlsx"]
    const pathParts = relativePath.split("/").filter((part) => part);

    if (pathParts.length < 2) {
      throw new Error(
        `Invalid file path. Expected format: /{documentLibrary}/{filePath}`,
      );
    }

    const documentLibraryName = pathParts[0];
    const filePath = "/" + pathParts.slice(1).join("/");

    if (!documentLibraryName) {
      throw new Error(
        `Invalid file path. Could not extract document library name from path.`,
      );
    }

    try {
      // First, get the drive ID for the document library
      const drivesResponse = await this.graphApi.get(`/sites/${siteId}/drives`);
      const drives = drivesResponse.data.value;

      // Find the drive that matches our document library name
      const drive = drives.find(
        (d: any) =>
          d.name.toLowerCase() === documentLibraryName.toLowerCase() ||
          d.name.toLowerCase() ===
            decodeURIComponent(documentLibraryName).toLowerCase(),
      );

      if (!drive) {
        throw new Error(
          `Document library "${documentLibraryName}" not found. Available libraries: ${drives.map((d: any) => d.name).join(", ")}`,
        );
      }

      // Use the drive ID to access the file
      const graphApiUrl = `/sites/${siteId}/drives/${drive.id}/root:${filePath}:/content`;
      console.log(
        `SharepointClient: Fetching file from Graph API URL: ${graphApiUrl}`,
      );

      const response = await this.graphApi.get(graphApiUrl, {
        responseType: "arraybuffer",
      });
      return Buffer.from(response.data);
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      let detailedErrorMessage = `Failed to fetch file content from SharePoint URL "${fileUrl}".`;

      if (status === 404) {
        detailedErrorMessage += ` File not found in document library "${documentLibraryName}" at path "${filePath}".`;
      }

      if (errorData) {
        try {
          const errorDataStr = Buffer.isBuffer(errorData)
            ? errorData.toString()
            : typeof errorData === "object"
              ? JSON.stringify(errorData)
              : String(errorData);
          const errorJson = JSON.parse(errorDataStr);
          if (errorJson.error?.message) {
            detailedErrorMessage += ` SharePoint Error: ${errorJson.error.message}`;
          } else {
            detailedErrorMessage += ` Details: ${errorDataStr}`;
          }
        } catch (parseError) {
          detailedErrorMessage += ` Raw Error Details: ${Buffer.isBuffer(errorData) ? errorData.toString() : String(errorData)}`;
        }
      } else if (error.message && !status) {
        detailedErrorMessage += ` Error: ${error.message}`;
      }

      console.error(`SharepointClient: ${detailedErrorMessage}`, error.stack);
      throw new Error(detailedErrorMessage);
    }
  }
}
