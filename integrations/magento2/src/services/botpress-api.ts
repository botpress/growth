import axios from "axios";
import { Client, Table } from "@botpress/client";
import * as bp from ".botpress";
import {
  AttributeMapping,
  ColumnNameMapping,
  OAuthClient,
  OAuthToken,
  ProductRow,
} from "../types/magento";
import { shortenColumnName } from "../utils/magento";
import { ProductAttributeSchema } from "../misc/zod-schemas";
import { sleep } from "../utils/common";

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000;

export async function apiCallWithRetry<T>(
  request: () => Promise<T>,
  logger: bp.Logger,
  maxRetries = MAX_RETRIES,
  initialDelay = INITIAL_DELAY
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status && (status === 429 || status >= 500) && i < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, i) * (1 + Math.random());
          logger
            .forBot()
            .warn(
              `API call failed with status ${status}. Retrying in ${delay.toFixed(0)}ms... (Attempt ${
                i + 1
              }/${maxRetries})`
            );
          await sleep(delay);
          continue;
        }
      }
      logger
        .forBot()
        .error(
          "API call failed after all retries or with a non-retriable error.",
          error
        );
      throw error;
    }
  }
  throw new Error("API call failed after all retries.");
}

export async function createOrGetTable(
  tableName: string,
  customAttributeCodes: string[],
  apiBaseUrl: string,
  httpHeaders: Record<string, string>,
  log: bp.Logger
): Promise<{ tableId: string; tableSchema: Table["schema"] }> {
  const bpClient = new Client({
    apiUrl: apiBaseUrl,
    headers: httpHeaders,
  });

  const defaultPropertiesTemplate: Record<string, { type: string }> = {
    sku: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    price: { type: "number" },
    original_price: { type: "number" },
    currency: { type: "string" },
    image_url: { type: "string" },
    thumbnail_url: { type: "string" },
    stock_qty: { type: "number" },
    is_in_stock: { type: "boolean" },
    average_rating: { type: "number" },
    review_count: { type: "number" },
  };

  const properties = { ...defaultPropertiesTemplate };

  for (const attrCode of customAttributeCodes) {
    const shortName = shortenColumnName(attrCode);
    properties[shortName] = { type: "string" };
  }

  if (Object.keys(properties).length > 20) {
    throw new Error(
      `Too many columns: ${Object.keys(properties).length}. Max is 20.`
    );
  }

  try {
    const response = await bpClient.getOrCreateTable({
      table: tableName,
      schema: { type: "object", properties: properties },
    });

    const tableId = response.table.id;
    const tableSchema = response.table.schema;

    log.info(`Table ${tableName} found/created with ID: ${tableId}`);
    return { tableId, tableSchema };
  } catch (error) {
    log.error(`Failed to get or create table ${tableName}:`, error);
    throw error;
  }
}

export async function fetchAttributeMappings(
  customAttributeCodes: string[],
  columnNameMappings: ColumnNameMapping,
  attributeMappings: AttributeMapping,
  magentoDomain: string,
  storeCode: string,
  oauth: OAuthClient,
  token: OAuthToken,
  headers: Record<string, string>,
  log: bp.Logger
): Promise<void> {
  if (customAttributeCodes.length === 0) return;

  log.info("Fetching attribute mappings for custom attributes");
  for (const attrCode of customAttributeCodes) {
    try {
      const originalAttributeName = columnNameMappings[attrCode] || attrCode;
      const attrUrl = `https://${magentoDomain}/rest/${storeCode}/V1/products/attributes/${originalAttributeName}`;
      const attrResponse = await apiCallWithRetry(
        () =>
          axios({
            method: "GET",
            url: attrUrl,
            headers: {
              ...oauth.toHeader(
                oauth.authorize({ url: attrUrl, method: "GET" }, token)
              ),
              ...headers,
            },
          }),
        log
      );
      const attribute = ProductAttributeSchema.parse(attrResponse.data);
      if (attribute.options && attribute.options.length > 0) {
        attributeMappings[attrCode] = {};
        for (const option of attribute.options) {
          attributeMappings[attrCode][option.value] = option.label;
        }
        log.info(
          `Mapped ${attribute.options.length} options for attribute ${originalAttributeName}`
        );
      }
    } catch (error) {
      const originalAttributeName = columnNameMappings[attrCode] || attrCode;
      const errorMessage = `Failed to get attribute mapping for ${originalAttributeName}: ${error instanceof Error ? error.message : "Unknown error"}`;
      log.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }
}

export async function insertProductsToTable(
  tableId: string,
  rowsToInsert: ProductRow[],
  apiBaseUrl: string,
  httpHeaders: Record<string, string>,
  tableName: string,
  log: bp.Logger
): Promise<void> {
  if (rowsToInsert.length === 0) return;

  log.info(`Inserting ${rowsToInsert.length} rows into table ${tableName}`);

  // Initialize Botpress client
  const bpClient = new Client({
    apiUrl: apiBaseUrl,
    headers: httpHeaders,
  });

  try {
    // Use the Botpress client's createTableRows method
    await bpClient.createTableRows({
      table: tableId,
      rows: rowsToInsert,
    });

    log.info(`Successfully inserted rows for table ${tableName}`);
  } catch (error) {
    log.error(`Failed to insert rows into table ${tableName}:`, error);
    throw error;
  }
}
